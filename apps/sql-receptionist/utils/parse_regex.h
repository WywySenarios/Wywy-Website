#include <regex.h>

struct regex_iterator {
  regex_t *preg;
  regmatch_t *matches;
  int nmatch;
  char *target;
  char *cur;
};