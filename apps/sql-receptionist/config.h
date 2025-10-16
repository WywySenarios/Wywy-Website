struct reference_urls {
    const char* main;
    const char* db;
};

struct postgres_config
{
    const char *host;        // @todo validation
    const unsigned int port; // @todo validation
};

struct data_column
{
    const char *name;                  // @todo validation
    const char *datatype;              // @todo validation
    const char *invalid_input_message; // optional
    bool comments;               // optional, ?useless here?
    const char *entrytype;             // useless here
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

struct db
{
    const char *db_name; // @todo validation
    struct table *tables;
    unsigned int tables_count;
};

struct config
{
    struct reference_urls reference_urls;
    struct postgres_config postgres;
    struct db *dbs;
    unsigned int dbs_count;
};

extern void load_config(struct config **cfg);
