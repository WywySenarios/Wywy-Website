/**
 * Reads the main YAML config for the entire repo.
 */
#include <stdbool.h>
#include <cyaml/cyaml.h>

#define BUFFER_SIZE 104857600 - 1;

struct postgres_config { // top level config structure
    const char *host; // @todo validation
    const unsigned int port; // @todo validation
    const char *user; // @todo validation
    const char *password; // @todo validation
};

static const cyaml_schema_field_t postgres_config_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
			"host", CYAML_FLAG_POINTER,
			struct postgres_config, host, 0, CYAML_UNLIMITED),

    CYAML_FIELD_UINT(
			"port", CYAML_FLAG_OPTIONAL,
			struct postgres_config, port),
};

static const cyaml_schema_value_t postgres_config_schema = {
    CYAML_VALUE_MAPPING(CYAML_FLAG_POINTER,
			struct postgres_config, postgres_config_fields_schema),
};

struct data_column {
    const char *name; // @todo validation
    const char *datatype; // @todo validation
    const char *invalid_input_message; // optional
    const bool comments; // optional, ?useless here?
    const char *entrytype; // useless here

};

static const cyaml_schema_field_t data_column_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
			"name", CYAML_FLAG_POINTER,
			struct data_column, name, 0, CYAML_UNLIMITED),
    
    CYAML_FIELD_STRING_PTR(
			"datatype", CYAML_FLAG_POINTER,
			struct data_column, datatype, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
			"invalidInputMessage", CYAML_FLAG_POINTER,
			struct data_column, invalid_input_message, 0, CYAML_UNLIMITED),

    CYAML_FIELD_BOOL(
			"comments", CYAML_FLAG_POINTER_NULL,
			struct data_column, comments),
    
    CYAML_FIELD_STRING_PTR(
			"entrytype", CYAML_FLAG_POINTER,
			struct data_column, entrytype   , 0, CYAML_UNLIMITED),
};

struct table {
    const char *table_name; // @todo validation
    const char *read; // @todo validation
    const char *write; // @todo validation
    const char *entrytype; // @todo validation
    struct data_column *schema;
};

struct db {
    const char *dbName; // @todo validation
    struct table_field *tables;
};

struct data { // top level config structure
    struct db_field *dbs;
};

/* Schema for string pointer values (used in sequences of strings). */
static const cyaml_schema_value_t string_ptr_schema = {
	CYAML_VALUE_STRING(CYAML_FLAG_POINTER, char, 0, CYAML_UNLIMITED),
};

// @todo verify that 10 is a good size of nesting & clarify to the user
// void getElement(char[10][BUFFER_SIZE + 1] *path) {

// }