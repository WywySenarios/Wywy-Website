/**
 * Reads the main YAML config for the entire repo.
 */
#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <cyaml/cyaml.h>

struct postgres_config
{
    const char *host;        // @todo validation
    const unsigned int port; // @todo validation
    const char *user;        // @todo validation
    const char *password;    // @todo validation
};

static const cyaml_schema_field_t postgres_config_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "host", CYAML_FLAG_POINTER,
        struct postgres_config, host, 0, CYAML_UNLIMITED),

    CYAML_FIELD_UINT(
        "port", CYAML_FLAG_OPTIONAL,
        struct postgres_config, port),

    CYAML_FIELD_STRING_PTR(
        "user", CYAML_FLAG_POINTER,
        struct postgres_config, user, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
        "password", CYAML_FLAG_POINTER,
        struct postgres_config, password, 0, CYAML_UNLIMITED),
    CYAML_FIELD_END};

struct data_column
{
    const char *name;                  // @todo validation
    const char *datatype;              // @todo validation
    const char *invalid_input_message; // optional
    bool comments;               // optional, ?useless here?
    const char *entrytype;             // useless here
};

static const cyaml_schema_field_t data_column_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "name", CYAML_FLAG_POINTER,
        struct data_column, name, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
        "datatype", CYAML_FLAG_POINTER,
        struct data_column, datatype, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
        "invalidInputMessage", CYAML_FLAG_POINTER | CYAML_FLAG_OPTIONAL,
        struct data_column, invalid_input_message, 0, CYAML_UNLIMITED),

    CYAML_FIELD_BOOL(
        "comments", CYAML_FLAG_OPTIONAL,
        struct data_column, comments),

    CYAML_FIELD_STRING_PTR(
        "entrytype", CYAML_FLAG_POINTER,
        struct data_column, entrytype, 0, CYAML_UNLIMITED),
    CYAML_FIELD_END};

    static const cyaml_schema_value_t data_column_schema = {
    CYAML_VALUE_MAPPING(
        CYAML_FLAG_DEFAULT,      /* No special flags */
        struct data_column,      /* Struct type */
        data_column_fields_schema/* Field schema for mapping */
    )
};



struct table
{
    const char *table_name; // @todo validation
    bool read;       // @todo validation
    bool write;      // @todo validation
    const char *entrytype;  // @todo validation
    struct data_column *schema;
    unsigned int schema_count;
};

static const cyaml_schema_field_t table_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "tableName", CYAML_FLAG_POINTER,
        struct table, table_name, 0, CYAML_UNLIMITED),

    CYAML_FIELD_BOOL(
        "read", CYAML_FLAG_DEFAULT,
        struct table, read),

    CYAML_FIELD_BOOL(
        "write", CYAML_FLAG_DEFAULT,
        struct table, write),

    CYAML_FIELD_STRING_PTR(
        "entrytype", CYAML_FLAG_POINTER,
        struct table, entrytype, 0, CYAML_UNLIMITED),

    CYAML_FIELD_SEQUENCE("schema", CYAML_FLAG_POINTER, struct table, schema, &data_column_schema, 0, CYAML_UNLIMITED),
    CYAML_FIELD_END};

static const cyaml_schema_value_t table_schema = {
    CYAML_VALUE_MAPPING(CYAML_FLAG_POINTER, struct table, table_fields_schema)
};

struct db
{
    const char *db_name; // @todo validation
    struct table *tables;
    unsigned int tables_count;
};

static const cyaml_schema_field_t db_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "dbname", CYAML_FLAG_POINTER,
        struct db, db_name, 0, CYAML_UNLIMITED),

    CYAML_FIELD_SEQUENCE("tables", CYAML_FLAG_POINTER, struct db, tables, &table_schema, 0, CYAML_UNLIMITED),
    CYAML_FIELD_END
};

static const cyaml_schema_value_t db_schema = {
    CYAML_VALUE_MAPPING(CYAML_FLAG_POINTER, struct db, db_fields_schema)
};

struct data
{
    struct db *dbs;
    unsigned int dbs_count;
};

// static const cyaml_schema_field_t data_fields_schema[] = {
//     CYAML_FIELD_SEQUENCE("dbs", CYAML_FLAG_POINTER, struct data, dbs, &db_fields_schema, 0, CYAML_UNLIMITED),
//     CYAML_FIELD_END};

// top level structure for the config
struct config
{
    struct postgres_config postgres;
    struct db *dbs;
    unsigned int dbs_count;
};

static const cyaml_schema_field_t config_fields_schema[] = {
    CYAML_FIELD_MAPPING("postgres", CYAML_FLAG_DEFAULT, struct config, postgres, postgres_config_fields_schema),
    CYAML_FIELD_SEQUENCE("data", CYAML_FLAG_POINTER, struct config, dbs, &db_schema, 0, CYAML_UNLIMITED),
    CYAML_FIELD_IGNORE("python", CYAML_FLAG_OPTIONAL),
    CYAML_FIELD_END
};

static const cyaml_schema_value_t config_schema = {
    CYAML_VALUE_MAPPING(CYAML_FLAG_POINTER, struct config, config_fields_schema)
};

static const cyaml_config_t cyaml_config = {
    .log_fn = cyaml_log,            /* Use the default logging function. */
    .flags = CYAML_CFG_IGNORE_UNKNOWN_KEYS,
    .mem_fn = cyaml_mem,            /* Use the default memory allocator. */
    .log_level = CYAML_LOG_WARNING, /* Logging errors and warnings only. */
};

int main()
{
    struct config *config;
    cyaml_err_t err = cyaml_load_file("config.yml", &cyaml_config, &config_schema, (void **) &config, NULL);

    if (err != CYAML_OK)
    {
        fprintf(stderr, "Failed to load config: %s\n", cyaml_strerror(err));

        if (err == CYAML_ERR_BAD_TYPE_IN_SCHEMA) {
            printf("gottem");
        }
        return EXIT_FAILURE;
    }

    printf("%s\n", config->postgres.host);
    printf("%u\n", config->postgres.port);
}