/**
 * Reads the main YAML config for the entire repo.
 */
#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <cyaml/cyaml.h>
#include "config.h"

#define CONFIG_PATH "../../config.yml" // Change to ../../config.yml if running from apps/sql-receptionist (i.e. outside docker)

static const cyaml_schema_field_t reference_urls_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "main", CYAML_FLAG_POINTER,
        struct reference_urls, main, 0, CYAML_UNLIMITED),
    CYAML_FIELD_STRING_PTR("db", CYAML_FLAG_POINTER,
        struct reference_urls, db, 0, CYAML_UNLIMITED),
};

static const cyaml_schema_field_t postgres_config_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "host", CYAML_FLAG_POINTER,
        struct postgres_config, host, 0, CYAML_UNLIMITED),

    CYAML_FIELD_UINT(
        "port", CYAML_FLAG_OPTIONAL,
        struct postgres_config, port),
    CYAML_FIELD_END};

static const cyaml_schema_field_t data_column_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "name", CYAML_FLAG_POINTER,
        struct data_column, name, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
        "datatype", CYAML_FLAG_POINTER,
        struct data_column, datatype, 0, CYAML_UNLIMITED),

    CYAML_FIELD_STRING_PTR(
        "invalidInputMessage", CYAML_FLAG_OPTIONAL,
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
    CYAML_VALUE_MAPPING(CYAML_FLAG_DEFAULT, struct table, table_fields_schema)
};

static const cyaml_schema_field_t db_fields_schema[] = {
    CYAML_FIELD_STRING_PTR(
        "dbname", CYAML_FLAG_POINTER,
        struct db, db_name, 0, CYAML_UNLIMITED),

    CYAML_FIELD_SEQUENCE("tables", CYAML_FLAG_POINTER, struct db, tables, &table_schema, 0, CYAML_UNLIMITED),
    CYAML_FIELD_END
};

static const cyaml_schema_value_t db_schema = {
    CYAML_VALUE_MAPPING(CYAML_FLAG_DEFAULT, struct db, db_fields_schema)
};

// top level structure for the config

static const cyaml_schema_field_t config_fields_schema[] = {
    CYAML_FIELD_MAPPING("referenceUrls", CYAML_FLAG_DEFAULT, struct config, reference_urls, reference_urls_schema),
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

/**
 * Attempts to load the global configuration file.
 * @param cfg Pointer to use for output. This pointer should be empty to prevent memory leaks in the case that the configuration fails to load.
 * @return Null if the configuration could not be loaded, otherwise a pointer to the loaded configuration (struct config).
 */
void load_config(struct config **cfg) {
    cyaml_err_t err = cyaml_load_file(CONFIG_PATH, &cyaml_config, &config_schema, (void **)cfg, NULL);

    if (err != CYAML_OK) {
        fprintf(stderr, "Failed to load config: %s\n", cyaml_strerror(err));

        *cfg = NULL;
    }
}