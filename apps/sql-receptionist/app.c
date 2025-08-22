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
#include "config.h"

#define PORT 2523 // @todo make this configurable
#define BUFFER_SIZE 104857600 - 1
#define AUTH_DB_NAME "auth" // @todo make this configurable
#define MAX_URL_SECTIONS 3

// nice global variables!
static struct config *global_config = NULL;

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

void build_http_response(const char *file_name, const char *file_ext, char *response, size_t *response_len)
{
    // build HTTP header
    const char *mime_type = get_mime_type(file_ext);
    char *header = (char *)malloc(BUFFER_SIZE * sizeof(char));
    snprintf(header, BUFFER_SIZE, "HTTP/1.1 200 OK\r\n"
                                  "Content-Type: %s\r\n"
                                  "\r\n",
             mime_type);

    // if file does not exist, response is 404 Not Found
    int file_fd = open(file_name, O_RDONLY);
    if (file_fd == -1)
    {
        snprintf(response, BUFFER_SIZE, "HTTP/1.1 404 Not Found\r\n"
                                        "Content-Type: text/plain\r\n"
                                        "\r\n"
                                        "404 Not Found");
        *response_len = strlen(response);
        return;
    }

    // get file size for Content-Length
    struct stat file_stat;
    fstat(file_fd, &file_stat);
    off_t file_size = file_stat.st_size;

    // copy header to response buffer
    *response_len = 0;
    memcpy(response, header, strlen(header));
    *response_len += strlen(header);

    // copyy file to response buffer
    ssize_t bytes_read;
    while ((bytes_read = read(file_fd, response + *response_len, BUFFER_SIZE - *response_len)) > 0)
    {
        *response_len += bytes_read;
    }

    free(header);
    close(file_fd);
}

/**
 * Builds a 200 HTTP response (OK).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. IDK if this includes the null terminator.
 * @param text The text to include in the response body.
 */
void *build_response_200(char *response, size_t *response_len, const char *text)
{
    snprintf(response, BUFFER_SIZE, "HTTP/1.1 200 OK\r\n"
                                    "Content-Type: text/plain\r\n"
                                    "\r\n"
                                    "%s", text);
    *response_len = strlen(response);
}

/**
 * Builds a 400 HTTP response (Bad Request).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. IDK if this includes the null terminator.
 */
void *build_response_400(char *response, size_t *response_len)
{
    snprintf(response, BUFFER_SIZE, "HTTP/1.1 400 Bad Request\r\n"
                                    "Content-Type: text/plain\r\n"
                                    "\r\n"
                                    "400 Bad Request");
    *response_len = strlen(response);
}

/**
 * Builds a 403 HTTP response (Forbidden).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. IDK if this includes the null terminator.
 */
void *build_response_403(char *response, size_t *response_len)
{
    snprintf(response, BUFFER_SIZE, "HTTP/1.1 403 Forbidden\r\n"
                                    "Content-Type: text/plain\r\n"
                                    "\r\n"
                                    "403 Forbidden");
    *response_len = strlen(response);
}

/**
 * Builds a 404 HTTP response (Not Found).
 * @param response A pointer to a sequence of characters representing the response
 * @param response_len The length of the response. IDK if this includes the null terminator.
 */
void *build_response_404(char *response, size_t *response_len)
{
    snprintf(response, BUFFER_SIZE, "HTTP/1.1 404 Not Found\r\n"
                                    "Content-Type: text/plain\r\n"
                                    "\r\n"
                                    "404 Not Found");
    *response_len = strlen(response);
}

/**
 * Attempts to query the database with the given query.
 * @param query A pointer to a sequence of characters representing the query to execute. This does NOT free the query if it is successful.
 * @return bool indicating whether the query was successful or not.
 */
bool sql_query(char *dbname, char *query, PGresult **res)
{
    size_t conninfo_size = 1 + 35 + strlen(dbname) + strlen(global_config->postgres.user) + strlen(global_config->postgres.password) + strlen(global_config->postgres.host) + 5;
    char *conninfo = malloc(conninfo_size);
    snprintf(conninfo, conninfo_size,
             "dbname=%s user=%s password=%s host=%s port=%u",
             dbname,
             global_config->postgres.user,
             global_config->postgres.password,
             global_config->postgres.host,
             global_config->postgres.port);

    PGconn *conn = PQconnectdb(conninfo);

    if (PQstatus(conn) != CONNECTION_OK)
    {
        PQfinish(conn);
        free(conninfo);
        return false;
    }

    // Submit & Execute query
    *res = PQexec(conn, query);
    ExecStatusType status = PQresultStatus(*res);

    free(conninfo);

    if (status == PGRES_TUPLES_OK)
    {
        return true;
    }
    else
    {
        PQfinish(conn);
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

    printf("%s\n", buffer);
    //
    if (bytes_received <= 0)
    {
        // send HTTP response to client
        build_response_400(response, &response_len);
        goto end;
    }

    // @todo cookies/tokens
    // @todo special/reserved URLs

    regex_t regex;
    regcomp(&regex, "^([A-Z]+) /([^ ]*) HTTP/[12]", REG_EXTENDED);

    regmatch_t matches[3];

    regex_t url_regex;
    regcomp(&url_regex, "^/([^/]+)/([^/]+)", REG_EXTENDED); // "[^/]+"

    regmatch_t url_matches[MAX_URL_SECTIONS + 1];

    // Does the request have a URL?
    if (regexec(&regex, buffer, 3, matches, 0) != 0)
    {
        build_response_400(response, &response_len);
        goto unsuccessful_regex_end;
    }

    // extract database name and table name from request
    // @todo validate the request
    if (matches[1].rm_so == -1 || matches[2].rm_so == -1)
    {
        // send HTTP response to client
        build_response_400(response, &response_len);
        goto unsuccessful_regex_end;
    }
    // extract method @todo check if rm_eo should actually be the second term
    int method_len = matches[1].rm_eo - matches[1].rm_so;
    char *method = malloc(method_len + 1);
    strncpy(method, buffer + matches[1].rm_so, method_len);
    method[method_len] = '\0';

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
    if (regexec(&url_regex, url, MAX_URL_SECTIONS + 1, url_matches, 0) != 0 || 
        url_matches[1].rm_so == -1 || url_matches[2].rm_so == -1)
    {
        build_response_400(response, &response_len);
        goto bad_url_end;
    }

    printf("Received request: %s %s %s\n", method, path, querystring ? querystring : "No query");

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

found_table:
    // didn't find a table? Tell the client that there's no such table
    if (table == NULL)
    {

        build_response_400(response, &response_len);
    }
    else
    {
        if (strcmp(method, "GET") == 0)
        {
            // check if the database & table may be accessed freely
            if (table->read)
            {
                // try to access the database and query

                PGresult *res = NULL;
                
                // @todo allow-list input validation
                // @todo still vulnerable to changing the config

                // separate different entries by a semicolon and different columns by a comma

                //@todo
                build_response_200(response, &response_len);
            }
            else
            {
                build_response_403(response, &response_len);
            }
        }
        else if (strcmp(method, "POST") == 0)
        {
            // check if the database & table can be written to freely
            if (table->write)
            {
                //@todo
                build_response_200(response, &response_len, "");
            }
            else
            {
                build_response_403(response, &response_len);
            }
        }
        else
        {
            // tell the client I don't understand what's going on
            build_response_400(response, &response_len);
        }
    }

    // free memory
no_table_end:
    free(db_name);
    free(table_name);

bad_url_end:
    free(url);
    free(method);

unsuccessful_regex_end:
    regfree(&regex);
    regfree(&url_regex);

end:
    // send HTTP response to client
    send(client_fd, response, response_len, 0);

    close(client_fd);
    free(response);
    free(arg);
    free(buffer);
}

int main(int argc, char const *argv[])
{
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
        pthread_create(&thread_id, NULL, handle_client, (void *)client_fd);
        pthread_detach(thread_id);
    }

    // close the listening socket
    close(server_fd);
    return 0;
}