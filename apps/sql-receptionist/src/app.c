/**
 * This application attempts to dynamically execute SQL queries to regular
 * databases. This application should not handle more sensitive databases, and
 * should instead ignore them.
 * @todo create separate file for basic HTTP server functionalities (this file
 * should only handle decision making)
 * @todo create separate ORM file
 */

#include "config.h"
#include "server/responses.h"
#include "utils/format_string.h"
#include "utils/json/datatype_validation.h"
#include <arpa/inet.h>
#include <asm-generic/socket.h>
#include <ctype.h>
#include <dirent.h>
#include <fcntl.h>
#include <jansson.h>
#include <libpq-fe.h>
#include <netinet/in.h>
#include <pthread.h>
#include <regex.h>
#include <signal.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#define PORT 2523 // @todo make this configurable
#define BUFFER_SIZE 104857600 - 1
#define MAX_ENTRY_SIZE 1048576 - 1
#define AUTH_DB_NAME "auth" // @todo make this configurable
#define MAX_URL_SECTIONS 3
#define MAX_REGEX_MATCHES 25
#define limit "20"
#define NUM_DATATYPES_KEYS 1
#define MAX_PASSWORD_LENGTH 255

int done;
void handle_sigterm(int signal_num) {
  printf("Received SIGTERM. Exiting now...\n");
  done = 1;
  exit(1);
}

void handle_sigint(int signal_num) {
  printf("Received SIGINT. Exiting now...\n");
  done = 1;
  exit(1);
}

char *admin_creds;

struct dict_item {
  char *key;
  void *value;
} typedef dict_item;

struct dict {
  dict_item *pairs;
  size_t size;
} typedef dict;

// @todo log search?
/**
 * Attempts to (linear) search through a hashmap-like object (array of key-value
 * pairs) for a pair that has a certain key.
 * @return The item that was found or NULL if no item was found.
 */
dict_item *linear_search(dict dict, const char *key) {
  for (unsigned i = 0; i < dict.size; i++) {
    if (strcmp(dict.pairs[i].key, key) == 0) {
      return &dict.pairs[i];
    }
  }

  return NULL;
}

typedef int (*json_datatype_check_function)(const json_t *json);
/**
 *
 */
static char *json_to_string(const json_t *value) {
  char *output;
  if (!value) {
    return NULL;
  }

  switch (json_typeof(value)) {
  case JSON_STRING:
    output = malloc(strlen(json_string_value(value)) + 1);
    strcpy(output, json_string_value(value));
    return output;
  case JSON_INTEGER:
    output = malloc(32 + 1);
    snprintf(output, 32 + 1, "%lld", (long long)json_integer_value(value));
    return output;
  case JSON_REAL:
    output = malloc(64 + 1);
    snprintf(output, 64 + 1, "%.17g", json_real_value(value));
    return output;
  case JSON_TRUE:
    output = malloc(5);
    snprintf(output, 5, "true");
    return output;
  case JSON_FALSE:
    output = malloc(6);
    snprintf(output, 6, "false");
    return output;
  default:
    return NULL;
  }
}

// nice global variables!
static struct config *global_config = NULL;
char *schema_datatypes_keys[] = {"int",     "integer", "float", "number",
                                 "string",  "str",     "text",  "bool",
                                 "boolean", "date",    "time",  "timestamp"};
json_datatype_check_function schema_datatypes_values[] = {
    check_integer, check_integer,  check_real,     check_real,
    check_string,  check_string,   check_string,   check_bool,
    check_bool,    check_datelike, check_timelike, check_timestamplike,
};
static dict schema_datatypes;

/**
 * Decodes URLs, like "test%20test" -> "test test"
 * @param src The encoded URL to decode.
 * @return A pointer to a series of characters representing the decoded URL.
 */
char *url_decode(const char *src) {
  size_t src_len = strlen(src);
  char *decoded = malloc(src_len + 1);
  size_t decoded_len = 0;

  // decode %2x to hex
  for (size_t i = 0; i < src_len; i++) {
    if (src[i] == '%' && i + 2 < src_len) {
      int hex_val;
      sscanf(src + i + 1, "%2x", &hex_val);
      decoded[decoded_len++] = hex_val;
      i += 2;
    } else {
      decoded[decoded_len++] = src[i];
    }
  }

  // add null terminator
  decoded[decoded_len] = '\0';
  return decoded;
}

/**
 * Goes through the entry and checks for validity. Appends a related query to
 * enter the entry.
 * @param entry The entry to check and construct a query around.
 * @param schema The schema to check the entry against.
 * @param schema_count The size of the schema array.
 * @param query The string to append the new query into.
 * @param table_name The target table's name.
 * @returns Whether or not the entry is valid.
 */
int construct_validate_query(json_t *entry, struct data_column *schema,
                             unsigned int schema_count, char *query,
                             char *table_name) {
  const char *key;
  const json_t *value;

  int total_value_len = 0;
  int total_key_len = 0;
  int separator_len = 0;

  json_object_foreach(entry, key, value) {
    bool valid = false;

    // check for the case in which the JSON key relates to comments instead
    // of regular columns
    regex_t comments_regex;
    regcomp(&comments_regex, "_comments$", REG_EXTENDED);

    regmatch_t comments_matches[1 + 1];
    bool is_comments_column = !(regexec(&comments_regex, key, 1 + 1,
                                        comments_matches, 0) == REG_NOMATCH);
    regfree(&comments_regex);

    char *target_column;

    if (is_comments_column) {
      target_column = malloc(strlen(key) - strlen("_comments") + 1);
      strncpy(target_column, key, strlen(key) - strlen("_comments"));
      target_column[strlen(key) - strlen("_comments")] = '\0';
    } else {
      target_column = malloc(strlen(key) + 1);
      strcpy(target_column, key);
    }

    if (strcmp(target_column, "id") == 0) {
      // skip id column (postgres autoincrement should handle it)
      free(target_column);
      continue;

      // @TODO make sure postgres doesn't tweak out over incorrect next keys
      // regex_t id_regex;
      // regcomp(&id_regex, "^[0-9]+$", REG_EXTENDED);

      // regmatch_t id_matches[1];
      // valid = !(regexec(&id_regex, json_to_string(value), 1, id_matches, 0)
      // ==
      //           REG_NOMATCH);

      // regfree(&id_regex);
    } else
      for (int i = 0; i < schema_count; i++) {
        // find which entry in the schema matches

        if (str_cci_cmp(target_column, schema[i].name) == 0) {
          // check if the input is a comment and the column does not have
          // comments.
          if (is_comments_column) {
            if (schema[i].comments == false) {
              break;
            }

            // comments MUST have text
            if (check_string(value) == 0) {
              break;
            }
          } else {
            dict_item *item =
                linear_search(schema_datatypes, schema[i].datatype);
            // check if the input's datatype mismatches
            if (!item) {
              break;
            }
            json_datatype_check_function *related_datatype_checker =
                item->value;
            if ((*related_datatype_checker)(value) == 0) {
              break;
            }
          }

          valid = true;
          break;
        }
      }

    // also remember to catch when the key is not inside the table's schema
    if (!valid) {
      free(target_column);
      return 0;
    } else {
      // @todo optimize
      // char *key_string = json_to_string(key);
      char *value_string = json_to_string(value);
      total_value_len += strlen(value_string);
      total_key_len += strlen(key); // no need to use to_snake_case: it won't
                                    // change the length of the string.
      separator_len++;

      // free(key_string);
      free(value_string);
    }
    free(target_column);
  }

  separator_len--;
  // get ready and put in all the correct values
  char *column_names = malloc(total_key_len + separator_len + 1 + 1);
  char *values = malloc(total_value_len + separator_len + 1 + 1);

  // make them empty strings
  strncpy(column_names, "", 1);
  strncpy(values, "", 1);

  json_object_foreach(entry, key, value) {
    // char *key_string = json_to_string(key);
    char *value_string = json_to_string(value);
    char *snake_case_key = malloc(strlen(key) + 1);
    strcpy(snake_case_key, key);
    to_snake_case(snake_case_key);

    strncat(column_names, snake_case_key, strlen(key) + 1);
    strncat(column_names, ",", 1 + 1);
    strncat(values, value_string, strlen(value_string) + 1);
    strncat(values, ",", 1 + 1);

    free(snake_case_key);
    free(value_string);
  }

  // remove trailing commas
  column_names[strlen(column_names) - 1] = '\0';
  values[strlen(values) - 1] = '\0';

  int incoming_query_len = strlen("INSERT INTO  ()\nVALUES();") +
                           strlen(table_name) + total_value_len +
                           total_key_len + 2 * separator_len + 1;
  char *incoming_query = malloc(incoming_query_len);
  snprintf(incoming_query, incoming_query_len,
           "INSERT INTO %s (%s)\nVALUES(%s);", table_name, column_names,
           values);

  strncat(query, incoming_query, BUFFER_SIZE - strlen(query));
  return 1;
}

/**
 * Attempts to query the database with the given query.
 * This function assumes that the global config has the correct information on
 * the
 * @param dbname A pointer to a sequence of characters representing the database
 * name to connect to. This function does NOT free dbname.
 * @param query A pointer to a sequence of characters representing the query to
 * execute. This function does NOT free query.
 * @param res A double pointer to a PGresult pointer that will be set to the
 * result of the query. This function does NOT free *res.
 * @param conn A double pointer to a PGconn pointer that will be set to the
 * connection used. This function does NOT free *conn. This function creates a
 * connection if *conn is NULL, and assumes that the connection is correct if it
 * is not NULL. As a result, this function alone does NOT guarentee that the
 * connection refers to the given database name.
 * @return The status of the query as per PQstatus().
 */
ExecStatusType sql_query(char *dbname, char *query, PGresult **res,
                         PGconn **conn) {
  printf("Query: %s\n", query);

  if (*conn == NULL) {
    size_t conninfo_size = 1 + strlen("dbname= user= password= host= port=") +
                           strlen(dbname) + strlen(getenv("DB_USERNAME")) +
                           strlen(getenv("DB_PASSWORD")) +
                           strlen(global_config->postgres.host) + 5;
    char *conninfo = malloc(conninfo_size);
    snprintf(conninfo, conninfo_size,
             "dbname=%s user=%s password=%s host=%s port=%s", dbname,
             getenv("DB_USERNAME"), getenv("DB_PASSWORD"),
             global_config->postgres.host, getenv("POSTGRES_PORT"));

    *conn = PQconnectdb(conninfo);
    free(conninfo);
  }

  if (PQstatus(*conn) != CONNECTION_OK) {
    return PGRES_FATAL_ERROR;
  }

  // Submit & Execute query
  *res = PQexec(*conn, query);
  ExecStatusType status = PQresultStatus(*res);

  return status;
}

/**
 * Understand the client's request and decide what action to take based on the
 * request.
 */
void *handle_client(void *arg) {
  int client_fd = *((int *)arg);
  char *buffer = malloc(BUFFER_SIZE * sizeof(char));
  char **response = malloc(sizeof(char *));
  *response = malloc(BUFFER_SIZE * 2 * sizeof(char));
  size_t *response_len = malloc(sizeof(size_t *));

  // receive request data from client and store into buffer
  ssize_t bytes_received = recv(client_fd, buffer, BUFFER_SIZE, 0);

  // printf("%s\n", buffer);

  if (bytes_received <= 0) {
    build_response_default(400, response, response_len);
    goto end;
  }

  regex_t regex;
  regcomp(&regex, "^([A-Z]+) /([^ ]*) HTTP/[12]\\.[0-9]",
          REG_EXTENDED); // @warning HTTP/1 not matching?

  regmatch_t matches[3];

  regex_t url_regex;
  regcomp(&url_regex, "([^/]+)/([^/]+)(/([^/]+))?", REG_EXTENDED); // "[^/]+"

  regmatch_t url_matches[MAX_URL_SECTIONS + 1];

  // Does the request have a URL?
  if (regexec(&regex, buffer, 3, matches, 0) == REG_NOMATCH) {
    build_response_default(400, response, response_len);
    goto unsuccessful_regex_end;
  }

  // extract database name and table name from request
  // @todo validate the request
  if (matches[1].rm_so == -1 || matches[2].rm_so == -1) {
    build_response_default(400, response, response_len);
    goto unsuccessful_regex_end;
  }

  // Extract the method
  int method_len = matches[1].rm_eo - matches[1].rm_so;
  char *method = malloc(method_len + 1);
  strncpy(method, buffer + matches[1].rm_so, method_len);
  method[method_len] = '\0';

  // immediately check for OPTIONS requests
  if (strcmp(method, "OPTIONS") == 0) {
    build_response_default(204, response, response_len);
    goto options_end;
  }

  // @todo special/reserved URLs

  // @todo tokens
  regex_t raw_cookie_regex;
  regcomp(&raw_cookie_regex, "Cookie: (.*)[\r\n]", REG_EXTENDED);

  regmatch_t raw_cookie_matches[1 + 1];
  // auth fails because request has no cookies
  if (regexec(&raw_cookie_regex, buffer, 1 + 1, raw_cookie_matches, 0) ==
      REG_NOMATCH) {
    regfree(&raw_cookie_regex);
    build_response_default(403, response, response_len);
    goto options_end;
  }

  int raw_cookies_len =
      raw_cookie_matches[1].rm_eo - raw_cookie_matches[1].rm_so;
  char *raw_cookies = malloc(raw_cookies_len + 1);
  strncpy(raw_cookies, buffer + raw_cookie_matches[1].rm_so, raw_cookies_len);
  raw_cookies[raw_cookies_len] = '\0';
  regfree(&raw_cookie_regex);

  bool admin_username = false;
  bool admin_password = false;

  regex_t cookie_regex;
  regcomp(&cookie_regex, "[ ]*([^= ;]+)[ ]*=[ ]*([^;\r\n]+)", REG_EXTENDED);

  regmatch_t cookie_matches[2 + 1];
  char *cursor = raw_cookies;
  while (regexec(&cookie_regex, cursor, 2 + 1, cookie_matches, 0) == 0) {
    int key_len = cookie_matches[1].rm_eo - cookie_matches[1].rm_so;
    char *key = malloc(key_len + 1);
    strncpy(key, cursor + cookie_matches[1].rm_so, key_len);
    key[key_len] = '\0';

    int value_len = cookie_matches[2].rm_eo - cookie_matches[2].rm_so;
    char *value = malloc(value_len + 1);
    strncpy(value, cursor + cookie_matches[2].rm_so, value_len);
    value[value_len] = '\0';

    if (strcmp(key, "username") == 0)
      admin_username = strcmp(value, "admin") == 0;
    else if (strcmp(key, "password") == 0)
      admin_password = strcmp(value, admin_creds) == 0;

    free(value);
    free(key);

    cursor += cookie_matches[0].rm_eo;

    // Skip any leftover semicolons or spaces
    while (*cursor == ';' || *cursor == ' ')
      cursor++;
  }

  free(raw_cookies);
  if (!(admin_username && admin_password)) {
    build_response_default(403, response, response_len);
    goto bad_auth_end;
  }
  // @todo non-admin cookies

  // extract URL from request and decode URL
  int url_len = matches[2].rm_eo - matches[2].rm_so;
  char *encoded_url = malloc(url_len + 1);
  strncpy(encoded_url, buffer + matches[2].rm_so,
          url_len); // @todo directly decode buffer
  encoded_url[url_len] = '\0';
  char *url = url_decode(encoded_url);
  free(encoded_url);

  // @todo handle memory?
  // handle querystring
  char *querystring = NULL;
  char *path = url;
  char *qmark = strchr(url, '?');
  if (qmark) {
    *qmark = '\0';           // terminate path at the first '?'
    querystring = qmark + 1; // everything after is the querystring
  }

  // does the URL have 2 or 3 segments?
  if (regexec(&url_regex, url, MAX_URL_SECTIONS + 1, url_matches, 0) ==
      REG_NOMATCH) {
    build_response_default(400, response, response_len);
    goto bad_url_end;
  }

  if (url_matches[1].rm_so == -1 || url_matches[2].rm_so == -1) {
    build_response_default(400, response, response_len);
    goto bad_url_end;
  }
  // decide what to do
  // first ensure that the method is uppercase
  // @todo verify if this is really needed
  for (int i = 0; method[i] != '\0'; i++) {
    method[i] = toupper((unsigned char)method[i]);
  }

  // search for the relevant table & database
  struct db *db = NULL;
  struct table *table = NULL;

  int db_name_len = url_matches[1].rm_eo - url_matches[1].rm_so;
  char *db_name = malloc(db_name_len + 1);
  strncpy(db_name, url + url_matches[1].rm_so, db_name_len);
  db_name[db_name_len] = '\0';

  regex_t table_regex;
  regcomp(&table_regex,
          "([a-zA-Z0-9_]+)_(tags|tag_aliases|tag_names|tag_groups|descriptors)",
          REG_EXTENDED);

  regmatch_t table_matches[2 + 1];
  char *table_name = NULL;
  int table_name_len = url_matches[2].rm_eo - url_matches[2].rm_so;
  table_name = malloc(table_name_len + 1);
  strncpy(table_name, url + url_matches[2].rm_so, table_name_len);
  table_name[table_name_len] = '\0';
  char *parent_table_name = NULL;
  // do not free table_extension because it is a part of url
  char *table_extension = NULL;

  // check for child tables
  if (regexec(&table_regex, url + url_matches[2].rm_so, 2 + 1, table_matches,
              0) == 0) {
    int parent_table_name_len =
        url_matches[2].rm_eo - url_matches[2].rm_so -
        (table_matches[2].rm_eo - table_matches[2].rm_so);
    parent_table_name = malloc(parent_table_name_len + 1);
    memcpy(table_name, table_name, parent_table_name_len);
    parent_table_name[parent_table_name_len] = '\0';

    // add an extra 1 to skip an underscore.
    table_extension = url + url_matches[2].rm_so + table_name_len + 1;
  }
  regfree(&table_regex);
  printf("%s\n", table_name);

  for (unsigned int i = 0; i < global_config->dbs_count; i++) {
    if (strcmp(global_config->dbs[i].db_name, db_name) == 0) {
      db = &global_config->dbs[i];
      break;
    }
  }

  // didn't find a database?
  if (!db) {
    build_response(400, response, response_len, "Database not found.");
    goto no_table_end;
  }

  if (parent_table_name) {
    for (unsigned int i = 0; i < db->tables_count; i++) {
      if (strcmp(db->tables[i].table_name, parent_table_name) == 0) {
        table = &db->tables[i];
      }
    }
  } else {
    for (unsigned int i = 0; i < db->tables_count; i++) {
      if (strcmp(db->tables[i].table_name, table_name) == 0) {
        table = &db->tables[i];
      }
    }
  }

  // didn't find a table? Tell the client that there's no such table
  if (!table) {
    build_response(400, response, response_len, "Table not found.");
    goto no_table_end;
  }

  // validate table extension if needed
  if (table_extension) {
    // tagging related
    if (strcmp(table_extension, "tags") == 0 ||
        strcmp(table_extension, "tag_aliases") == 0 ||
        strcmp(table_extension, "tag_names") == 0 ||
        strcmp(table_extension, "tag_groups") == 0) {
      if (!table->tagging) {
        build_response_printf(400, response, response_len,
                              strlen("Tagging is not enabled for table /") +
                                  strlen(table_name) + strlen(db_name),
                              "Tagging is not enabled for table %s/%s", db_name,
                              table_name);
        goto no_table_end;
      }
    } else if (strcmp(table_extension, "descriptors")) {
      if (!table->descriptors) {
        build_response_printf(
            400, response, response_len,
            strlen("Descriptors are not enabled for table /") +
                strlen(table_name) + strlen(db_name),
            "Descriptors are not enabled for table %s/%s", db_name, table_name);
        goto no_table_end;
      }
    } else {
      build_response_printf(400, response, response_len,
                            strlen(" is not a valid table extension.") +
                                strlen(table_extension),
                            "%s is not a valid "
                            "table extension.",
                            table_extension);
      goto no_table_end;
    }
  }

  if (strcmp(method, "GET") == 0) {
    // check if the database & table may be accessed freely
    if (table->read) {
      // try to access the database and query

      // @todo allow-list input validation
      // @todo still vulnerable to changing the config

      // check for the case where the user wants to get the next id
      if (url_matches[3].rm_so != -1) {
        int command_len = url_matches[3].rm_eo - url_matches[3].rm_so;
        char *command = malloc(command_len + 1);
        strncpy(command, url + url_matches[3].rm_so, command_len);
        command[command_len] = '\0';

        if (strcmp(command, "get_next_id") == 0) {
          PGconn *conn = NULL;
          PGresult *res = NULL;

          size_t query_len = strlen("SELECT MAX(id) AS highest_id\nFROM ;") +
                             strlen(table_name);
          char *query = malloc(query_len + 1);

          snprintf(query, query_len, "SELECT MAX(id) AS highest_id\nFROM %s;",
                   table_name);

          ExecStatusType sql_query_status =
              sql_query(db_name, query, &res, &conn);
          if (sql_query_status == PGRES_TUPLES_OK ||
              sql_query_status == PGRES_COMMAND_OK) {
            char *highest_id_str = PQgetvalue(res, 0, 0);
            if (highest_id_str && strlen(highest_id_str) > 0) {
              build_response(200, response, response_len, highest_id_str);
            } else {
              build_response(200, response, response_len, "1");
            }
          } else {
            // @todo determine if it's the client's fault or the server's fault
            build_response_printf(500, response, response_len,
                                  strlen(PQresStatus(sql_query_status)) + 2 +
                                      strlen(PQerrorMessage(conn)) + 1,
                                  "%s: %s", PQresStatus(sql_query_status),
                                  PQerrorMessage(conn));
          }

          if (res)
            PQclear(res);
          if (conn)
            PQfinish(conn);
          free(query);
        } else {
          build_response_default(400, response, response_len);
        }

        goto no_table_end;
      }

      // REQUIRES querystring to run
      if (querystring == NULL) {
        build_response_default(400, response, response_len);
        goto no_table_end;
      }

      regex_t querystring_regex;
      // slash all &'s separate, and the first = sign after the start of the
      // string or the last &
      regcomp(&querystring_regex, "[&]?([^=]+)=([^&]+)", REG_EXTENDED);

      regmatch_t querystring_matches[2 + 1];

      // many of these need to be non-null:
      char *select = NULL;
      char *order_by = NULL;
      char *min = NULL;
      int min_type = -1; // 1 for inclusive, 0 for exclusive
      char *max = NULL;
      int max_type = -1; // 1 for inclusive, 0 for exclusive

      char *querystring_copy = querystring;

      // read every querystring value
      // store every single valid key-value pair.
      while (regexec(&querystring_regex, querystring_copy, 2 + 1,
                     querystring_matches, 0) != REG_NOMATCH) {
        int item_name_len =
            querystring_matches[1].rm_eo - querystring_matches[1].rm_so;
        char *item_name = malloc(item_name_len + 1);
        strncpy(item_name, querystring_copy + querystring_matches[1].rm_so,
                item_name_len);
        item_name[item_name_len] = '\0';

        int value_len =
            querystring_matches[2].rm_eo - querystring_matches[2].rm_so;
        char *value = malloc(value_len + 1);
        strncpy(value, querystring_copy + querystring_matches[2].rm_so,
                value_len);
        value[value_len] = '\0';

        // change the querystring pointer so that it now looks for the next
        // match in the string
        // @todo please don't brute force by copying most of the string, just
        // edit the pointer value or something...
        querystring_copy = querystring_copy + querystring_matches[2].rm_eo;

        // what type is it?
        if (strcmp(item_name, "SELECT") == 0) {
          if (strcmp(value, "*") == 0) {
            select = "*";
          } else {
            for (unsigned i = 0; i < table->schema_count; i++) {
              if (strcmp(value, (*table).schema[i].name)) {
                select = value;
                break;
              }
            }
          }
        } else if (strcmp(item_name, "ORDER_BY") == 0) {
          if (strcmp(value, "ASC") == 0) {
            order_by = "ASC";
          } else if (strcmp(value, "DSC") == 0) {
            order_by = "DSC";
          }
        } else if (strcmp(item_name, "MIN_INCLUSIVE") == 0) {
          regex_t minmax_regex;
          regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

          regmatch_t minmax_matches[2];
          if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 &&
              min_type == -1) {
            min = value;
            min_type = 1;
          }
          regfree(&minmax_regex);
        } else if (strcmp(item_name, "MAX_INCLUSIVE") == 0) {
          regex_t minmax_regex;
          regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

          regmatch_t minmax_matches[2];
          if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 &&
              min_type == -1) {
            max = value;
            max_type = 1;
          }
          regfree(&minmax_regex);
        } else if (strcmp(item_name, "MIN_EXCLUSIVE") == 0) {
          regex_t minmax_regex;
          regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

          regmatch_t minmax_matches[2];
          if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 &&
              min_type == -1) {
            min = value;
            min_type = 0;
          }
          regfree(&minmax_regex);
        } else if (strcmp(item_name, "MAX_EXCLUSIVE") == 0) {
          regex_t minmax_regex;
          regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

          regmatch_t minmax_matches[2];
          if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 &&
              min_type == -1) {
            max = value;
            max_type = 0;
          }
          regfree(&minmax_regex);
        }

        // } else if (strcmp(item_name, "INDEX_BY")) {
        free(item_name);
        free(value);
      }

      // are the mandatory request params valid? We need something to select and
      // an order to sort it by.
      if (select && order_by) {
        PGconn *conn = NULL;
        PGresult *res = NULL;
        char *query = malloc(strlen("SELECT \nFROM \nORDER BY id \nLIMIT;") +
                             strlen(select) + strlen(table_name) +
                             strlen(order_by) + strlen(limit) + 1);
        char *output = malloc(BUFFER_SIZE); // @todo be more specific

        // decide the SQL query:
        snprintf(query, BUFFER_SIZE,
                 "SELECT %s\nFROM %s\nORDER BY id %s\nLIMIT %s", select,
                 table_name, order_by, limit);
        // add in the optional request params
        // @todo min/max
        // add in the last thing
        strcat(query, ";");

        // attempt to query the database
        ExecStatusType sql_query_status =
            sql_query(db_name, query, &res, &conn);
        if (sql_query_status == PGRES_TUPLES_OK ||
            sql_query_status ==
                PGRES_COMMAND_OK) { // if the query is successful,
          // convert the query information into JSON
          char *column_names = malloc(BUFFER_SIZE); // @todo be more specific
          column_names[0] = '\0';

          // add in the column names
          for (int col = 0; col < PQnfields(res); col++) {
            strcat(column_names, "\"");
            strcat(column_names, PQfname(res, col));
            strcat(column_names, "\",");
          }
          // remove trailing comma
          column_names[strlen(column_names) - 1] = '\0';

          char *output_arrs = malloc(BUFFER_SIZE); // @todo be more specific
          output_arrs[0] = '\0';

          // add in "[...]," for all the arrays
          // @todo optimize
          for (int row = 0; row < PQntuples(res); row++) {
            char *entry_arr = malloc(MAX_ENTRY_SIZE);
            strcpy(entry_arr, "[");

            for (int col = 0; col < PQnfields(res); col++) {
              if (!PQgetisnull(res, row, col)) {
                int requires_quotes = 0;
                // @todo binary search optimization
                switch (PQftype(res, col)) {
                case 25:
                case 1082:
                case 1083:
                case 1114:
                  requires_quotes = 1;
                  strcat(entry_arr, "\"");
                  break;
                default:
                  requires_quotes = 0;
                  break;
                }

                strcat(entry_arr, PQgetvalue(res, row, col));
                if (requires_quotes) {
                  strcat(entry_arr, "\"");
                }
              } else
                strcat(entry_arr, "null");
              strcat(entry_arr, ",");
            }
            // remove trailing comma
            entry_arr[strlen(entry_arr) - 1] = ']';

            strcat(entry_arr, ",");

            strcat(output_arrs, entry_arr);
            free(entry_arr);
          }
          // remove the trailing comma
          output_arrs[strlen(output_arrs) - 1] = '\0';

          snprintf(output, BUFFER_SIZE, "{\"columns\":[%s],\"data\":[%s]}",
                   column_names, output_arrs);
          build_response(200, response, response_len, output);
          free(column_names);
          free(output_arrs);
          free(output);
        } else {
          // @todo determine if it's the client's fault or the server's fault
          build_response_printf(500, response, response_len,
                                strlen(PQresStatus(sql_query_status)) + 2 +
                                    strlen(PQerrorMessage(conn)) + 1,
                                "%s: %s", PQresStatus(sql_query_status),
                                PQerrorMessage(conn));
        }

        if (res)
          PQclear(res);
        if (conn)
          PQfinish(conn);
        free(query);
      } else {
        build_response_default(400, response, response_len);
      }

      regfree(&querystring_regex);
      // free(select);
      // free(order_by);
      if (min) {
        free(min);
      }
      if (max) {
        free(max);
      }
    } else {
      // user does not have read access to the respective table
      build_response_default(403, response, response_len);
    }
  } else if (strcmp(method, "POST") == 0) {
    // check if the database & table can be written to freely
    if (table->write) {
      // verify the schema
      regex_t body_regex;
      regcomp(&body_regex, "\r\n\r\n(.+)", REG_EXTENDED);

      regmatch_t body_matches[1 + 1];

      if (regexec(&body_regex, buffer, 1 + 1, body_matches, 0) == REG_NOMATCH) {
        build_response_default(400, response, response_len);
        goto bad_body_end;
      }

      int body_len = body_matches[1].rm_eo - body_matches[1].rm_so;
      char *body = malloc(body_len + 1);
      strncpy(body, buffer + body_matches[1].rm_so, body_len);
      body[body_len] = '\0';

      printf("Body: %s\n\n", body);

      json_t *entry;
      json_error_t entry_error;
      entry = json_loads(body, 0, &entry_error);

      if (!entry) {
        // @TODO respond with line number, etc.
        build_response_printf(400, response, response_len,
                              strlen(entry_error.text), "%s", entry_error.text);
      }

      char *query = malloc(BUFFER_SIZE + 1);
      strcat(query, "BEGIN;");

      // populate the query with all the information that needs to be committed.
      // verify the validity of user input as we go. Exit if it is invalid.

      json_t *current_item;

      // go through the main data
      current_item = json_object_get(entry, "data");
      if (!current_item) {
        build_response(400, response, response_len, "Missing main data.");
        goto schema_mismatch_end;
      }
      if (!construct_validate_query(current_item, table->schema,
                                    table->schema_count, query, table_name)) {
        build_response(400, response, response_len,
                       "The given entry does not conform to the schema.");
        goto schema_mismatch_end;
      }

      // loop through every descriptor if needed
      if (table->descriptors) {
        json_t *all_descriptors = json_object_get(entry, "descriptors");

        // null and type check
        if (!json_is_object(all_descriptors)) {
          build_response(400, response, response_len, "Missing descriptors.");
          goto schema_mismatch_end;
        }

        const char *descriptor_name;
        json_t *descriptors;
        json_object_foreach(all_descriptors, descriptor_name, descriptors) {
          // search for the correct schema @TODO better complexity
          struct descriptor *cur = table->descriptors;
          struct descriptor *descriptor_schema = NULL;

          for (int i = 0; i < table->descriptors_count; i++) {
            if (strcmp(descriptor_name, cur->name) == 0) {
              descriptor_schema = cur;
              break;
            }

            cur += sizeof(struct descriptor);
          }

          if (!descriptor_schema) {
            build_response_printf(
                400, response, response_len,
                strlen("Descriptor name  not found.") + strlen(descriptor_name),
                "Descriptor name %s not found.", descriptor_name);
            goto schema_mismatch_end;
          }

          if (!json_is_array(descriptors)) {
            build_response(400, response, response_len, "Descriptors ");
            goto schema_mismatch_end;
          }

          // loop through every descriptor
          int index;
          json_t *descriptor;
          json_array_foreach(descriptors, index, descriptor) {
            if (!json_is_object(descriptor)) {
              build_response(400, response, response_len,
                             "Invalid or empty descriptor.");
              goto schema_mismatch_end;
            }
            if (!construct_validate_query(descriptor, descriptor_schema->schema,
                                          descriptor_schema->schema_count,
                                          query, table_name)) {
              build_response_printf(400, response, response_len,
                                    strlen("A  descriptor did not conform to "
                                           "the schema.") +
                                        strlen(descriptor_name),
                                    "A %s descriptor did "
                                    "not conform to the "
                                    "schema.",
                                    descriptor_name);
              goto schema_mismatch_end;
            }
          }
        }
      } else if (json_object_get(entry, "descriptors")) {
        build_response_printf(400, response, response_len,
                              strlen("Table  does not have descriptors.") +
                                  strlen(table_name) + 1,
                              "Table %s does not "
                              "have descriptors.",
                              table_name);
      }

      strncat(query, "COMMIT;", BUFFER_SIZE - strlen(query));

      PGconn *conn = NULL;
      PGresult *res = NULL;
      ExecStatusType sql_query_status = sql_query(db_name, query, &res, &conn);
      if (sql_query_status != PGRES_COMMAND_OK &&
          sql_query_status != PGRES_TUPLES_OK) {
        build_response_printf(500, response, response_len,
                              strlen(PQresStatus(sql_query_status)) + 2 +
                                  strlen(PQerrorMessage(conn)) + 1,
                              "%s: %s", PQresStatus(sql_query_status),
                              PQerrorMessage(conn));
      } else {
        build_response(200, response, response_len,
                       "Entry successfully added.");
      }

      if (res)
        PQclear(res);
      if (conn)
        PQfinish(conn);
    schema_mismatch_end:
      free(query);
    post_bad_input_end:
      free(body);
    bad_body_end:
      regfree(&body_regex);
      // free json object??? how ???
      json_decref(entry);
    } else {
      // user does not have write access to the respective table
      build_response_default(403, response, response_len);
    }
  } else {
    // tell the client I don't understand what's going on
    build_response_default(400, response, response_len);
  }

  // free memory
no_table_end:
  free(db_name);
  free(table_name);
  free(parent_table_name);
  // do not free table_extension because it is a part of url

bad_url_end:
  free(url);

bad_auth_end:
  regfree(&cookie_regex);

unsuccessful_regex_end:
  regfree(&url_regex);

options_end:
  free(method);
  regfree(&regex);

end:
  // send HTTP response to client
  send(client_fd, *response, *response_len, 0);

  printf("Response:\n%s\n\n", *response);

  close(client_fd);
  free(*response);
  free(response);
  free(response_len);
  free(arg);
  free(buffer);
  return NULL;
}

int main(int argc, char const *argv[]) {
  // exit if environment variables are missing
  if (!getenv("POSTGRES_PORT")) {
    fprintf(stderr, "Could not find environment variable POSTGRES_PORT.");
    exit(EXIT_FAILURE);
  }
  if (!getenv("DB_USERNAME")) {
    fprintf(stderr, "Could not find environment variable DB_USERNAME.");
    exit(EXIT_FAILURE);
  }
  if (!getenv("DB_PASSWORD")) {
    fprintf(stderr, "Could not find environment variable DB_PASSWORD.");
    exit(EXIT_FAILURE);
  }

  // attempt to read admin password
  admin_creds = malloc(MAX_PASSWORD_LENGTH + 1);
  FILE *admin_secret = fopen("/run/secrets/admin", "r");

  if (!admin_secret) {
    printf("Could not find admin password secret.");
    exit(EXIT_FAILURE);
  }

  fgets(admin_creds, MAX_PASSWORD_LENGTH + 1, admin_secret);

  fclose(admin_secret);

  // setup for SIGTERM
  done = 0;
  signal(SIGTERM, handle_sigterm);
  signal(SIGINT, handle_sigint);

  // populate global variables
  load_config(&global_config);
  init(global_config);
  if (global_config == NULL) {
    fprintf(stderr, "Failed to load configuration.\n");
    return EXIT_FAILURE;
  } else {
    printf("Successfully loaded config:\n");
    printf(" * Postgres Settings:\n");
    printf("   - Host: %s\n", global_config->postgres.host);
    printf("   - Port: %s\n", getenv("POSTGRES_PORT"));
    printf("   - User: %s\n", getenv("DB_USERNAME"));
    printf("Recognized %u databases:\n", global_config->dbs_count);
    for (unsigned int i = 0; i < global_config->dbs_count; i++) {
      // transform all database names into lower snake case
      to_lower_snake_case(global_config->dbs[i].db_name);

      printf(" * %s:\n", global_config->dbs[i].db_name);
      printf("   - Name: %s\n", global_config->dbs[i].db_name);
      for (unsigned int j = 0; j < global_config->dbs[i].tables_count; j++) {
        // transform all table names into lower snake case
        to_lower_snake_case(global_config->dbs[i].tables[j].table_name);
        printf("     - Table %s:\n",
               global_config->dbs[i].tables[j].table_name);
        printf("       + Read: %s\n",
               global_config->dbs[i].tables[j].read ? "true" : "false");
        printf("       + Write: %s\n",
               global_config->dbs[i].tables[j].write ? "true" : "false");
      }
    }
  }

  schema_datatypes.size =
      sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]);
  schema_datatypes.pairs =
      malloc(sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]) *
             sizeof(dict_item));
  // populate the dictionary
  for (int i = 0;
       i < sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]);
       i++) {
    schema_datatypes.pairs[i].key = schema_datatypes_keys[i];
    // funny pointer business with functions
    schema_datatypes.pairs[i].value = &schema_datatypes_values[i];
  }

  // Set up the server
  int server_fd;
  size_t valread;
  struct sockaddr_in address;
  int opt = 1;
  socklen_t addrlen = sizeof(address);

  // Creating socket file descriptior
  if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
    perror("Socket creation failed");
    exit(EXIT_FAILURE);
  }

  // Attach socket to the given port
  if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt,
                 sizeof(opt))) {
    perror("setsockopt");
    exit(EXIT_FAILURE);
  }
  address.sin_family = AF_INET;
  address.sin_addr.s_addr = INADDR_ANY;
  address.sin_port = htons(PORT);

  // continue attaching socket to the given port
  if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
    perror("Bind failed");
    exit(EXIT_FAILURE);
  }
  if (listen(server_fd, 3) < 0) {
    perror("Listen failed");
    exit(EXIT_FAILURE);
  }

  printf("Listening on Port %u.\n", PORT);

  while (!done) {
    // client info
    int *client_fd = malloc(sizeof(int));

    // accept client connection?
    if ((*client_fd =
             accept(server_fd, (struct sockaddr *)&address, &addrlen)) < 0) {
      perror("accept");
      continue;
    }

    // create a new thread to handle client request
    pthread_t thread_id;
    if (pthread_create(&thread_id, NULL, handle_client, (void *)client_fd) !=
        0) {
      perror("thread create");
      close(*client_fd);
      free(client_fd);
      // @todo send a nice error msg
    } else {
      pthread_detach(thread_id);
    }
  }

  // close the listening socket
  close(server_fd);
  return 0;
}