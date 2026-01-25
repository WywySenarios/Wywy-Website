#ifndef HEADER_CONFIG
#define HEADER_CONFIG
#include "config.h"
#endif
#include "utils/format_string.h"
#include "utils/json/datatype_validation.h"
#include "utils/json/json_conversion.h"
#include "utils/regex_item.h"
#include <jansson.h>
#include <string.h>

/**
 * Goes through the entry and checks for validity. Creates a query to store the
 * entry.
 * @param entry The entry to check and construct a query around.
 * @param schema The schema to check the entry against.
 * @param schema_count The size of the schema array.
 * @param query The pointer that will eventually point to the newly created
 * query.
 * @param table_name The target table's name.
 * @param primary_column_name The name of the primary column.
 * @returns 0 if the query is invalid, 1 if the query is valid, -1 on unexpected
 * failure.
 */
int construct_validate_query(json_t *entry, struct data_column *schema,
                             unsigned int schema_count, char **query,
                             char *table_name,
                             const char *primary_column_name) {
  const char *key = NULL;
  const json_t *value = NULL;
  char *value_string = NULL;
  char *snake_case_key = NULL;

  // the status of the query.
  // 0 if the query is invalid,
  // 1 if the query is valid,
  // -1 on unexpected (e.g. malloc failure)
  int status = 1;

  int values_len = 0;
  int column_names_len = 0;
  int separator_len = 0;

  json_object_foreach(entry, key, value) {
    bool valid = false;
    value_string = json_to_string(value);

    if (!value_string) {
      return -1;
    }

    size_t target_column_len = strlen(key) + 1;
    char *target_column = NULL;

    // check for the case in which the JSON key relates to comments instead
    // of regular columns
    int is_comments_column = regex_check("_comments$", 1, REG_EXTENDED, 0, key);

    switch (is_comments_column) {
    case 0:
      break;
    case 1:
      target_column_len -= strlen("_comments");
      break;
    default:
      status = -1;
      goto construct_validate_query_end;
    }
    target_column = malloc(target_column_len);
    if (!target_column) {
      status = -1;
      goto construct_validate_query_end;
    }
    memcpy(target_column, key, target_column_len - 1);
    target_column[target_column_len - 1] = '\0';

    if (strcmp(target_column, "id") == 0) {
      // skip id column (postgres autoincrement should handle it)

      // @TODO make sure postgres doesn't tweak out over incorrect next keys
      switch (regex_check("^[0-9]+$", 0, REG_EXTENDED, 0, value_string)) {
      case 0:
        valid = false;
        break;
      case 1:
        valid = true;
        break;
      default:
        // @todo cleaner looking way of exiting
        free(target_column);
        return -1;
        break;
      }
    } else if (strcmp(target_column, "primary_tag") == 0) {
      // it's hard to validate FOREIGN KEY so we'll let Postgres take care of
      // this.
      switch (regex_check("^[0-9]+$", 0, REG_EXTENDED, 0, value_string)) {
      case 0:
        valid = false;
        break;
      case 1:
        valid = true;
        break;
      default:
        // @todo cleaner looking way of exiting
        free(target_column);
        return -1;
        break;
      }
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
            if (!check_column(value, schema))
              break;
          }

          valid = true;
          break;
        }
      }

    // also remember to catch when the key is not inside the table's schema
    if (!valid) {
      free(target_column);
      free(value_string);
      return 0;
    } else {
      // @todo optimize
      values_len += strlen(value_string) + 1;
      column_names_len +=
          strlen(key) + 1; // no need to use to_snake_case: it won't
                           // change the length of the string.
    }
    free(target_column);
    free(value_string);
  }
  values_len--;
  column_names_len--;

  // get ready and put in all the correct values
  char *column_names = malloc(column_names_len + 1);
  char *values = malloc(values_len + 1);

  // make them empty strings
  strncpy(column_names, "", 1);
  strncpy(values, "", 1);

  json_object_foreach(entry, key, value) {
    if (strcmp(key, "id") == 0)
      continue;

    value_string = json_to_string(value);
    snake_case_key = malloc(strlen(key) + 1);

    if (!value_string || !snake_case_key) {
      status = -1;
      goto construct_validate_query_end;

      return -1;
    }
    strncpy(snake_case_key, key, strlen(key) + 1);
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

  size_t query_len = strlen("INSERT INTO  () VALUES() RETURNING ;") +
                     strlen(table_name) + (column_names_len) + (values_len) +
                     strlen(primary_column_name) + 1;
  *query = malloc(query_len);
  if (!*query)
    return -1;
  snprintf(*query, query_len, "INSERT INTO %s (%s) VALUES(%s) RETURNING %s;",
           table_name, column_names, values, primary_column_name);
  return status;

construct_validate_query_end:
  free(value_string);
  free(snake_case_key);

  return status;
}