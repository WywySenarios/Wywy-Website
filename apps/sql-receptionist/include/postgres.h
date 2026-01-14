#include <libpq-fe.h>
extern ExecStatusType sql_query(char *dbname, char *query, PGresult **res,
                         PGconn **conn);