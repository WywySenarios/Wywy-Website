/**
 * This application attempts to dynamically execute SQL queries to regular databases. This application should not handle more sensitive databases, and should instead ignore them.
 * @todo create separate file for basic HTTP server functionalities (this file should only handle decision making)
 * @todo create separate ORM file
 */

#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <regex.h>
#include <arpa/inet.h>
#include <ctype.h>
#include <dirent.h>
#include <libpq-fe.h>
#include <asm-generic/socket.h>
#include <jansson.h>
#include "config.h"

#define PORT 2523 // @todo make this configurable
#define BUFFER_SIZE 104857600 - 1
#define MAX_ENTRY_SIZE 1048576 - 1
#define AUTH_DB_NAME "auth" // @todo make this configurable
#define MAX_URL_SECTIONS 3
#define MAX_REGEX_MATCHES 25
#define limit "20"
#define NUM_DATATYPES_KEYS 1

struct dict_item
{
    char *key;
    void *value;
} typedef dict_item;

struct dict
{
    dict_item *pairs;
    size_t size;
} typedef dict;

// @todo log search?
/**
 * Attempts to (linear) search through a hashmap-like object (array of key-value pairs) for a pair that has a certain key.
 * @return The item that was found or NULL if no item was found.
 */
dict_item *linear_search(dict dict, const char *key)
{
    for (unsigned i = 0; i < dict.size; i++)
    {
        if (strcmp(dict.pairs[i].key, key) == 0)
        {
            return &dict.pairs[i];
        }
    }

    return NULL;
}

typedef int (*json_datatype_check_function)(const json_t *json);
static int check_integer(const json_t *json)
{
    return json_is_integer(json);
}
static int check_string(const json_t *json)
{
    return json_is_string(json);
}
static int check_real(const json_t *json)
{
    return json_is_real(json);
}
static int check_bool(const json_t *json)
{
    return json_is_boolean(json);
}
/**
 * Checks whether or not a given value is in the format xxxx-xx-xx
 * @param json The value to validate.
 * @return 0 if it is not a valid date, 1 if it's date-like
 */
static int check_datelike(const json_t *json)
{
    if (json_is_string(json))
    {
        const char *text = json_string_value(json);
        regex_t check_regex;
        regcomp(&check_regex, "[0-9]{1,4}-[0-9]{2}-[0-9]{2}", REG_EXTENDED);
        // Alternative pattern (does not account for february 29): xxxx-[1<=num<=12]-[valid date within that month]: ([0-9]{1,4})-?((02)-?([0]|[12][0-9])|(01|03|05|07|08|10|12)-?(0[1-9]|[12][0-9]|3[01])|(04|06|09|11)-?(0[1-9]|[12][0-9]|30))

        regmatch_t check_matches[4];

        if (regexec(&check_regex, text, 4, check_matches, 0) == REG_NOMATCH)
        {
            regfree(&check_regex);
            return 0;
        }

        if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1)
        {
            regfree(&check_regex);
            return 0;
        }

        // make sure it's just a datelike string and nothing else is after that.
        int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
        if (match_size == strlen(text) - 1)
        {
            regfree(&check_regex);
            return 1;
        }
        else
        {
            regfree(&check_regex);
            return 0;
        }
    }
    else
    {
        return 0;
    }
}
/**
 * Checks whether or not a given value is in the format of xx:xx:xxZ or TxxxxxxZ or xx:xx:xx.x... or Txxxxxx...
 */
static int check_timelike(const json_t *json)
{
    if (json_is_string(json))
    {
        const char *text = json_string_value(json);
        regex_t check_regex;
        regcomp(&check_regex, "[0-9]{2}:[0-9]{2}:[0-9]{2}Z|[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{1,6}Z|T[0-9]{6}Z|T[0-9]{6}.[0-9]{1,6}Z", REG_EXTENDED);

        regmatch_t check_matches[2];

        if (regexec(&check_regex, text, 2, check_matches, 0) == REG_NOMATCH)
        {
            regfree(&check_regex);
            return 0;
        }

        if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1)
        {
            regfree(&check_regex);
            return 0;
        }

        // make sure it's just a timelike string and nothing else is after that.
        int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
        if (match_size == strlen(text) - 1)
        {
            regfree(&check_regex);
            return 1;
        }
        else
        {
            regfree(&check_regex);
            return 0;
        }
    }
    else
    {
        return 0;
    }
}
static int check_timestamplike(const json_t *json)
{
    if (json_is_string(json))
    {
        const char *text = json_string_value(json);
        regex_t check_regex;
        regcomp(&check_regex, "([0-9]{1,4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}Z|[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{1,6}Z|T[0-9]{6}Z|T[0-9]{6}.[0-9]{1,6}Z)", REG_EXTENDED);

        regmatch_t check_matches[2];

        if (regexec(&check_regex, text, 2, check_matches, 0) == REG_NOMATCH)
        {
            regfree(&check_regex);
            return 0;
        }

        if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1)
        {
            regfree(&check_regex);
            return 0;
        }

        // make sure it's just a timelike string and nothing else is after that.
        int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
        if (match_size == strlen(text) - 1)
        {
            regfree(&check_regex);
            return 1;
        }
        else
        {
            regfree(&check_regex);
            return 0;
        }
    }
    else
    {
        return 0;
    }
}

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
char *schema_datatypes_keys[] = {
    "int",
    "integer",
    "float",
    "number",
    "string",
    "str",
    "text",
    "bool",
    "boolean",
    "date",
    "time",
    "timestamp"};
json_datatype_check_function schema_datatypes_values[] = {
    check_integer,
    check_integer,
    check_real,
    check_real,
    check_string,
    check_string,
    check_string,
    check_bool,
    check_bool,
    check_datelike,
    check_timelike,
    check_timestamplike,
};
static dict schema_datatypes;

const char *get_file_extension(const char *file_name)
{
    const char *dot = strrchr(file_name, '.');
    if (!dot || dot == file_name)
    {
        return "";
    }
    return dot + 1;
}

const char *get_mime_type(const char *file_ext)
{
    if (strcasecmp(file_ext, "html") == 0 || strcasecmp(file_ext, "htm") == 0)
    {
        return "text/html";
    }
    else if (strcasecmp(file_ext, "txt") == 0)
    {
        return "text/plain";
    }
    else if (strcasecmp(file_ext, "jpg") == 0 || strcasecmp(file_ext, "jpeg") == 0)
    {
        return "image/jpeg";
    }
    else if (strcasecmp(file_ext, "png") == 0)
    {
        return "image/png";
    }
    else
    {
        return "application/octet-stream";
    }
}

/**
 * Compares two series of characters without case sensitivity.
 * @param s1 A pointer to the first series of characters to compare
 * @param s2 A pointer to the second series of characters to compare
 * @return True if the two inputs are the same barring case sensitivity, false otherwise.
 */
bool case_insensitive_compare(const char *s1, const char *s2)
{
    while (*s1 && *s2)
    {
        if (tolower((unsigned char)*s1) != tolower((unsigned char)*s2))
        {
            return false;
        }
        s1++;
        s2++;
    }
    return *s1 == *s2;
}

/**
 * Decodes URLs, like "test%20test" -> "test test"
 * @param src The encoded URL to decode.
 * @return A pointer to a series of characters representing the decoded URL.
 */
char *url_decode(const char *src)
{
    size_t src_len = strlen(src);
    char *decoded = malloc(src_len + 1);
    size_t decoded_len = 0;

    // decode %2x to hex
    for (size_t i = 0; i < src_len; i++)
    {
        if (src[i] == '%' && i + 2 < src_len)
        {
            int hex_val;
            sscanf(src + i + 1, "%2x", &hex_val);
            decoded[decoded_len++] = hex_val;
            i += 2;
        }
        else
        {
            decoded[decoded_len++] = src[i];
        }
    }

    // add null terminator
    decoded[decoded_len] = '\0';
    return decoded;
}

/**
 * Builds a 200 HTTP response (OK).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 * @param text The text to include in the response body.
 */
void build_response_200(char **response, size_t *response_len, const char *text)
{
    *response_len = strlen("HTTP/1.1 200 OK\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Connection: close\r\n"
                           "\r\n") +
                    strlen(text);
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1, "HTTP/1.1 200 OK\r\n"
                                           "Content-Type: text/plain\r\n"
                                           "Access-Control-Allow-Origin: *\r\n"
                                           "Connection: close\r\n"
                                           "\r\n"
                                           "%s",
             text);
}

/**
 * Builds a 204 HTTP response (No Content).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 * @param text The text to include in the response body.
 */
void build_response_204(char **response, size_t *response_len)
{
    *response_len = strlen("HTTP/1.1 204 No Content\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
                           "Access-Control-Allow-Headers: Content-Type\r\n"
                           "Content-Length: 0\r\n"
                           "Connection: close\r\n"
                           "\r\n");
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1,
             "HTTP/1.1 204 No Content\r\n"
             "Access-Control-Allow-Origin: *\r\n"
             "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
             "Access-Control-Allow-Headers: Content-Type\r\n"
             "Content-Length: 0\r\n"
             "Connection: close\r\n"
             "\r\n");
}

/**
 * Builds a 400 HTTP response (Bad Request).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 */
void build_response_400(char **response, size_t *response_len)
{
    *response_len = strlen("HTTP/1.1 400 Bad Request\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Connection: close\r\n"
                           "\r\n"
                           "400 Bad Request");
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1, "HTTP/1.1 400 Bad Request\r\n"
                                     "Content-Type: text/plain\r\n"
                                     "Access-Control-Allow-Origin: *\r\n"
                                     "Connection: close\r\n"
                                     "\r\n"
                                     "400 Bad Request");
}

/**
 * Builds a 403 HTTP response (Forbidden).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 */
void build_response_403(char **response, size_t *response_len)
{
    *response_len = strlen("HTTP/1.1 403 Forbidden\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Connection: close\r\n"
                           "\r\n"
                           "403 Forbidden");
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1, "HTTP/1.1 403 Forbidden\r\n"
                                     "Content-Type: text/plain\r\n"
                                     "Access-Control-Allow-Origin: *\r\n"
                                     "Connection: close\r\n"
                                     "\r\n"
                                     "403 Forbidden");
}

/**
 * Builds a 404 HTTP response (Not Found).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 */
void build_response_404(char **response, size_t *response_len)
{
    *response_len = strlen("HTTP/1.1 404 Not Found\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Connection: close\r\n"
                           "\r\n"
                           "404 Not Found");
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1, "HTTP/1.1 404 Not Found\r\n"
                                     "Content-Type: text/plain\r\n"
                                     "Access-Control-Allow-Origin: *\r\n"
                                     "Connection: close\r\n"
                                     "\r\n"
                                     "404 Not Found");
}

/**
 * Builds a 500 HTTP response (Internal Server Error).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. Does not include the null terminator.
 */
void build_response_500(char **response, size_t *response_len)
{
    *response_len = strlen("HTTP/1.1 500 Internal Server Error\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: *\r\n"
                           "Connection: close\r\n"
                           "\r\n"
                           "500 Internal Server Error");
    *response = malloc(*response_len + 1);
    snprintf(*response, *response_len + 1, "HTTP/1.1 500 Internal Server Error\r\n"
                                     "Content-Type: text/plain\r\n"
                                     "Access-Control-Allow-Origin: *\r\n"
                                     "Connection: close\r\n"
                                     "\r\n"
                                     "500 Internal Server Error");
}

/**
 * Attempts to query the database with the given query. Memory is not freed by this function.
 * @param query A pointer to a sequence of characters representing the query to execute. This function does NOT free query.
 * @return bool indicating whether the query was successful or not.
 */
bool sql_query(char *dbname, char *query, PGresult **res, PGconn **conn)
{
    size_t conninfo_size = 1 + strlen("dbname= user= password= host= port=") + strlen(dbname) + strlen(global_config->postgres.user) + strlen(global_config->postgres.password) + strlen(global_config->postgres.host) + 5;
    char *conninfo = malloc(conninfo_size);
    snprintf(conninfo, conninfo_size,
             "dbname=%s user=%s password=%s host=%s port=%d",
             dbname,
             global_config->postgres.user,
             global_config->postgres.password,
             global_config->postgres.host,
             global_config->postgres.port);

    *conn = PQconnectdb(conninfo);

    if (PQstatus(*conn) != CONNECTION_OK)
    {
        PQfinish(*conn);
        free(conninfo);
        return false;
    }

    // Submit & Execute query
    *res = PQexec(*conn, query);
    ExecStatusType status = PQresultStatus(*res);

    free(conninfo);

    if (status == PGRES_TUPLES_OK)
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * Understand the client's request and decide what action to take based on the request.
 */
void *handle_client(void *arg)
{
    int client_fd = *((int *)arg);
    char *buffer = (char *)malloc(BUFFER_SIZE * sizeof(char));
    char *response = (char *)malloc(BUFFER_SIZE * 2 * sizeof(char));
    size_t response_len;

    // receive request data from client and store into buffer
    ssize_t bytes_received = recv(client_fd, buffer, BUFFER_SIZE, 0);

    // printf("%s\n", buffer);

    if (bytes_received <= 0)
    {
        build_response_400(&response, &response_len);
        goto end;
    }

    // @todo cookies/tokens
    // @todo special/reserved URLs

    regex_t regex;
    regcomp(&regex, "^([A-Z]+) /([^ ]*) HTTP/[12]\\.[0-9]", REG_EXTENDED); // @warning HTTP/1 not matching?

    regmatch_t matches[3];

    regex_t url_regex;
    regcomp(&url_regex, "([^/]+)/([^/]+)", REG_EXTENDED); // "[^/]+"

    regmatch_t url_matches[MAX_URL_SECTIONS + 1];

    // Does the request have a URL?
    if (regexec(&regex, buffer, 3, matches, 0) == REG_NOMATCH)
    {
        build_response_400(&response, &response_len);
        goto unsuccessful_regex_end;
    }

    // extract database name and table name from request
    // @todo validate the request
    if (matches[1].rm_so == -1 || matches[2].rm_so == -1)
    {
        build_response_400(&response, &response_len);
        goto unsuccessful_regex_end;
    }

    // Extract the method
    int method_len = matches[1].rm_eo - matches[1].rm_so;
    char *method = malloc(method_len + 1);
    strncpy(method, buffer + matches[1].rm_so, method_len);
    method[method_len] = '\0';

    // immediately check for OPTIONS requests
    if (strcmp(method, "OPTIONS") == 0)
    {
        build_response_204(&response, &response_len);
        goto options_end;
    }

    // extract URL from request and decode URL
    int url_len = matches[2].rm_eo - matches[2].rm_so;
    char *encoded_url = malloc(url_len + 1);
    strncpy(encoded_url, buffer + matches[2].rm_so, url_len); // @todo directly decode buffer
    encoded_url[url_len] = '\0';
    char *url = url_decode(encoded_url);
    free(encoded_url);

    // handle querystring
    char *querystring = NULL;
    char *path = url;
    char *qmark = strchr(url, '?');
    if (qmark)
    {
        *qmark = '\0';           // terminate path at the first '?'
        querystring = qmark + 1; // everything after is the querystring
    }

    // does the URL have 2 segments?
    if (regexec(&url_regex, url, MAX_URL_SECTIONS + 1, url_matches, 0) == REG_NOMATCH)
    {
        build_response_400(&response, &response_len);
        goto bad_url_end;
    }

    if (
        url_matches[1].rm_so == -1 || url_matches[2].rm_so == -1)
    {
        build_response_400(&response, &response_len);
        goto bad_url_end;
    }
    // decide what to do
    // first ensure that the method is uppercase
    // @todo verify if this is really needed
    for (int i = 0; method[i] != '\0'; i++)
    {
        method[i] = toupper((unsigned char)method[i]);
    }

    // search for the relevant table & database
    struct db *db = NULL;
    struct table *table = NULL;

    int db_name_len = url_matches[1].rm_eo - url_matches[1].rm_so;
    char *db_name = malloc(db_name_len + 1);
    strncpy(db_name, url + url_matches[1].rm_so, db_name_len);
    db_name[db_name_len] = '\0';
    int table_name_len = url_matches[2].rm_eo - url_matches[2].rm_so;
    char *table_name = malloc(table_name_len + 1);
    strncpy(table_name, url + url_matches[2].rm_so, table_name_len);
    table_name[table_name_len] = '\0';

    for (unsigned int i = 0; i < global_config->dbs_count; i++)
    {
        db = &global_config->dbs[i];
        if (case_insensitive_compare(db->db_name, db_name))
        {
            for (unsigned int j = 0; j < db->tables_count; j++)
            {
                if (case_insensitive_compare(db->tables[j].table_name, table_name))
                {
                    table = &db->tables[j];
                    goto found_table;
                }
            }
        }
    }
    // didn't find a table? Tell the client that there's no such table
    if (table == NULL)
    {

        build_response_400(&response, &response_len);
        goto no_table_end;
    }

found_table:
    if (strcmp(method, "GET") == 0)
    {
        // check if the database & table may be accessed freely
        if (table->read)
        {
            // try to access the database and query

            // @todo allow-list input validation
            // @todo still vulnerable to changing the config

            regex_t querystring_regex;
            // slash all &'s separate, and the first = sign after the start of the string or the last &
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
            while (regexec(&querystring_regex, querystring_copy, 2 + 1, querystring_matches, 0) != REG_NOMATCH)
            {
                int item_name_len = querystring_matches[1].rm_eo - querystring_matches[1].rm_so;
                char *item_name = malloc(item_name_len + 1);
                strncpy(item_name, querystring_copy + querystring_matches[1].rm_so, item_name_len);
                item_name[item_name_len] = '\0';

                int value_len = querystring_matches[2].rm_eo - querystring_matches[2].rm_so;
                char *value = malloc(value_len + 1);
                strncpy(value, querystring_copy + querystring_matches[2].rm_so, value_len);
                value[value_len] = '\0';

                // change the querystring pointer so that it now looks for the next match in the string
                // @todo please don't brute force by copying most of the string, just edit the pointer value or something...
                querystring_copy = querystring_copy + querystring_matches[2].rm_eo;

                // what type is it?
                if (strcmp(item_name, "SELECT") == 0)
                {
                    if (strcmp(value, "*") == 0)
                    {
                        select = "*";
                    }
                    else
                    {
                        for (unsigned i = 0; i < table->schema_count; i++)
                        {
                            if (strcmp(value, (*table).schema[i].name))
                            {
                                select = value;
                                break;
                            }
                        }
                    }
                }
                else if (strcmp(item_name, "ORDER BY") == 0)
                {
                    if (strcmp(value, "ASC") == 0)
                    {
                        order_by = "ASC";
                    }
                    else if (strcmp(value, "DSC") == 0)
                    {
                        order_by = "DSC";
                    }
                }
                else if (strcmp(item_name, "MIN_INCLUSIVE") == 0)
                {
                    regex_t minmax_regex;
                    regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

                    regmatch_t minmax_matches[2];
                    if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 && min_type == -1)
                    {
                        min = value;
                        min_type = 1;
                    }
                    regfree(&minmax_regex);
                }
                else if (strcmp(item_name, "MAX_INCLUSIVE") == 0)
                {
                    regex_t minmax_regex;
                    regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

                    regmatch_t minmax_matches[2];
                    if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 && min_type == -1)
                    {
                        max = value;
                        max_type = 1;
                    }
                    regfree(&minmax_regex);
                }
                else if (strcmp(item_name, "MIN_EXCLUSIVE") == 0)
                {
                    regex_t minmax_regex;
                    regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

                    regmatch_t minmax_matches[2];
                    if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 && min_type == -1)
                    {
                        min = value;
                        min_type = 0;
                    }
                    regfree(&minmax_regex);
                }
                else if (strcmp(item_name, "MAX_EXCLUSIVE") == 0)
                {
                    regex_t minmax_regex;
                    regcomp(&minmax_regex, "[0-9]", REG_EXTENDED);

                    regmatch_t minmax_matches[2];
                    if (regexec(&minmax_regex, value, 2, minmax_matches, 0) != 0 && min_type == -1)
                    {
                        max = value;
                        max_type = 0;
                    }
                    regfree(&minmax_regex);
                }

                // } else if (strcmp(item_name, "INDEX_BY")) {
                free(item_name);
                free(value);
            }

            // are the mandatory request params valid? We need something to select and an order to sort it by.
            if (select && order_by)
            {
                PGconn *conn;
                PGresult *res;
                char *query = malloc(strlen("SELECT \nFROM \nORDER BY id \nLIMIT;") + strlen(select) + strlen(table_name) + strlen(order_by) + strlen(limit) + 1);
                char *output = malloc(BUFFER_SIZE); // @todo be more specific

                // decide the SQL query:
                snprintf(query, BUFFER_SIZE, "SELECT %s\nFROM %s\nORDER BY id %s\nLIMIT %s", select, table_name, order_by, limit);
                // add in the optional request params
                // @todo min/max
                // add in the last thing
                strcat(query, ";");

                // attempt to query the database
                if (sql_query(db_name, query, &res, &conn))
                { // if the query is successful,
                    // convert the query information into JSON
                    char *output_arrs = malloc(BUFFER_SIZE); // @todo be more specific
                    output_arrs[0] = '\0';

                    // add in "[...]," for all the arrays
                    for (int row = 0; row < PQntuples(res); row++)
                    {
                        char *entry_arr = malloc(MAX_ENTRY_SIZE);
                        strcpy(entry_arr, "[");

                        for (int col = 0; col < PQnfields(res); col++)
                        {
                            strcat(entry_arr, PQgetvalue(res, row, col));
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

                    snprintf(output, BUFFER_SIZE, "{\"data\":[%s]}", output_arrs);
                    build_response_200(&response, &response_len, output);
                    free(output_arrs);
                    free(output);
                }
                else
                {
                    // @todo determine if it's the client's fault or the server's fault
                    build_response_500(&response, &response_len);
                }

                free(query);
                PQclear(res);
            }
            else
            {
                build_response_400(&response, &response_len);
            }

            regfree(&querystring_regex);
            // free(select);
            // free(order_by);
            if (min)
            {
                free(min);
            }
            if (max)
            {
                free(max);
            }
        }
        else
        {
            // user does not have read access to the respective table
            build_response_403(&response, &response_len);
        }
    }
    else if (strcmp(method, "POST") == 0)
    {
        // check if the database & table can be written to freely
        if (table->write)
        {
            // verify the schema
            regex_t body_regex;
            regcomp(&body_regex, "\r\n\r\n(.+)", REG_EXTENDED);

            regmatch_t body_matches[1 + 1];

            if (regexec(&body_regex, buffer, 1 + 1, body_matches, 0) == REG_NOMATCH)
            {
                build_response_400(&response, &response_len);
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

            if (!entry)
            {
                build_response_400(&response, &response_len);
            }

            const char *key;
            const json_t *value;

            int total_value_len = 0;
            int total_key_len = 0;
            int separator_len = 0;

            json_object_foreach(entry, key, value)
            {
                bool valid = false;

                for (int i = 0; i < table->schema_count; i++)
                {
                    // find which entry in the schema matches
                    if (strcmp(key, table->schema[i].name) == 0)
                    {
                        json_datatype_check_function *related_datatype_checker = linear_search(schema_datatypes, table->schema[i].datatype)->value;
                        // check if the input is bad
                        if (!related_datatype_checker)
                        {
                            break;
                        } else if ((*related_datatype_checker)(value) == 0) {
                            printf("HEY!!!: %s\n", json_to_string(value));
                            break;
                        }

                        valid = true;

                        // char *key_string = json_to_string(key);
                        char *value_string = json_to_string(value);
                        total_value_len += strlen(key); // @todo optimize
                        total_key_len += strlen(value_string);
                        separator_len++;

                        // free(key_string);
                        free(value_string);
                    }
                }

                // also remember to catch when the key is not inside the table's schema
                if (! valid) {
                    build_response_400(&response, &response_len);
                    goto post_bad_input_end;
                }
            }

            separator_len--;
            // get ready and put in all the correct values
            char *column_names = malloc(total_key_len + separator_len + 1 + 1);
            char *values = malloc(total_value_len + separator_len + 1 + 1);

            json_object_foreach(entry, key, value) {
                // char *key_string = json_to_string(key);
                char *value_string = json_to_string(value);

                strcat(column_names, key);
                strcat(column_names, ",");
                strcat(values, value_string);
                strcat(values, ",");

                // free(key_string);
                free(value_string);
            }

            // remove trailing commas
            column_names[strlen(column_names) - 1] = '\0';
            values[strlen(values) - 1] = '\0';

            int query_len = strlen("INSERT INTO  ()\nVALUES ();") + total_value_len + total_key_len + 2 * separator_len + 1;
            char *query = malloc(query_len);
            // strcat(query, "INSERT INTO (");
            // memcpy(query, column_names, total_key_len + separator_len);
            // strcat(query, ")\nVALUES (");
            // memcpy(query, values, total_value_len + separator_len);
            // strcat(query, ");");
            snprintf(query, query_len,"INSERT INTO %s (%s)\nVALUES(%s);", table_name, column_names, values);

            PGconn *conn;
            PGresult *res;
            sql_query(db_name, query, &res, &conn);

            build_response_200(&response, &response_len, "");

            // free memory
        post_bad_input_end:
            free(body);
        bad_body_end:
            regfree(&body_regex);
            // free json object??? how ???
        }
        else
        {
            // user does not have write access to the respective table
            build_response_403(&response, &response_len);
        }
    }
    else
    {
        // tell the client I don't understand what's going on
        build_response_400(&response, &response_len);
    }

    // free memory
no_table_end:
    free(db_name);
    free(table_name);

bad_url_end:
    free(url);

unsuccessful_regex_end:
    regfree(&url_regex);

options_end:
    free(method);
    regfree(&regex);

end:
    // send HTTP response to client
    send(client_fd, response, response_len, 0);

    printf("Response:\n%s\n\n", response);

    close(client_fd);
    free(response);
    free(arg);
    free(buffer);
}

int main(int argc, char const *argv[])
{
    // populate global variables
    load_config(&global_config);
    if (global_config == NULL)
    {
        fprintf(stderr, "Failed to load configuration.\n");
        return EXIT_FAILURE;
    }
    else
    {
        printf("Successfully loaded config:\n");
        printf(" * Postgres Settings:\n");
        printf("   - Host: %s\n", global_config->postgres.host);
        printf("   - Port: %u\n", global_config->postgres.port);
        printf("   - User: %s\n", global_config->postgres.user);
        printf("Recognized %u databases:\n", global_config->dbs_count);
        for (unsigned int i = 0; i < global_config->dbs_count; i++)
        {
            printf(" * %s:\n", global_config->dbs[i].db_name);
            printf("   - Name: %s\n", global_config->dbs[i].db_name);
            for (unsigned int j = 0; j < global_config->dbs[i].tables_count; j++)
            {
                printf("     - Table %s:\n", global_config->dbs[i].tables[j].table_name);
                printf("       + Read: %s\n", global_config->dbs[i].tables[j].read ? "true" : "false");
                printf("       + Write: %s\n", global_config->dbs[i].tables[j].write ? "true" : "false");
            }
        }
    }
    schema_datatypes.size = sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]);
    schema_datatypes.pairs = malloc(sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]) * sizeof(dict_item));
    // populate the dictionary
    for (int i = 0; i < sizeof(schema_datatypes_keys) / sizeof(schema_datatypes_keys[0]); i++)
    {
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
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0)
    {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    // Attach socket to the given port
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt)))
    {
        perror("setsockopt");
        exit(EXIT_FAILURE);
    }
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    // continue attaching socket to the given port
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0)
    {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }
    if (listen(server_fd, 3) < 0)
    {
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }

    printf("Listening on Port %u.\n", PORT);

    while (1)
    {
        // client info
        int *client_fd = malloc(sizeof(int));

        // accept client connection?
        if ((*client_fd = accept(server_fd, (struct sockaddr *)&address, &addrlen)) < 0)
        {
            perror("accept");
            continue;
        }

        // create a new thread to handle client request
        pthread_t thread_id;
        if (pthread_create(&thread_id, NULL, handle_client, (void *)client_fd) != 0) {
            perror("thread create");
            close(*client_fd);
            // @todo send a nice error msg
        } else {
            pthread_detach(thread_id);
        }
    }

    // close the listening socket
    close(server_fd);
    return 0;
}