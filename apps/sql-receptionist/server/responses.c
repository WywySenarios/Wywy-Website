#include <stdarg.h>
#include <stdio.h>
#include "config.h"

static struct config *global_config = NULL;

void init(config cfg) {
    global_config = cfg;

    // @TODO check validity
}

const char * get_status_code_name(int status_code) {
    switch (status_code) {
        case 200:
            return "OK";
        case 204:
            return "No Content";
        case 400:
            return "Bad Request";
        case 403:
            return "Forbidden";
        case 404:
            return "Not Found";
        case 500:
            return "Internal Server Error";
        default:
            return "";
    }
}

void build_response_generic(int status_code, char **response, size_t *response_len, char *body) {
    const char *status_code_name = get_status_code_name(status_code);

    response_len = strlen("HTTP/1.1 xxx \r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: \r\n"
                           "Access-Control-Allow-Credentials: true\r\n"
                           "Connection: close\r\n"
                           "\r\n") + strlen(status_code_name) + strlen(global_config->reference_urls.main) + strlen(body);
    response = malloc(response_len + 1);
    snprintf(response, repsonse_len + 1, "HTTP/1.1 %d %s\r\n"
                           "Content-Type: text/plain\r\n"
                           "Access-Control-Allow-Origin: %s\r\n"
                           "Access-Control-Allow-Credentials: true\r\n"
                           "Connection: close\r\n"
                           "\r\n%s", status_code, status_code_name, global_config->reference_urls.main, body);
}

void build_response(int status_code, char **response, size_t *response_len, const char *pattern, size_t text_size, ...) {
    va_list arg;
    char *body = malloc(text_size + 1);
    va_start(arg, pattern);
    vsnprintf(body, text_size, pattern, arg);
    va_end(arg);

    build_response_generic(repsonse, response_len, body);
    
    free(body);
}

void build_response_default(int status_code, char **response, size_t *response_len) {}