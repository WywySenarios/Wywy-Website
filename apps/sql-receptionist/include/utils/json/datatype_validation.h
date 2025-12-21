#include <jansson.h>

extern int check_integer(const json_t *json);
extern int check_string(const json_t *json);
extern int check_real(const json_t *json);
extern int check_bool(const json_t *json);
extern int check_datelike(const json_t *json);
extern int check_timelike(const json_t *json);
extern int check_timestamplike(const json_t *json);