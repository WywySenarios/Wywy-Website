/**
 * Helper library for running regex and storing output into strings.
 * One shot style.
 */

#include "utils/regex_item.h"
#include <regex.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int regex_check(char *pattern, int num_matches, int cflags, int eflags,
                const char *target) {
  int output = -1;
  if (num_matches <= 0)
    return -1;

  regex_t *preg = malloc(sizeof(regex_t));

  if (!preg || regcomp(preg, pattern, cflags) != 0) {
    free(preg);
    return -1;
  }

  regmatch_t matches[num_matches + 1];

  switch (regexec(preg, target, num_matches + 1, matches, eflags)) {
  case 0:
    output = 1;
    break;
  default:
    output = 0;
    break;
  }
  free(preg);
  return output;
}

regmatch_t *query_regex(char *pattern, int num_matches, int cflags, int eflags,
                        char *target) {
  if (num_matches <= 0)
    return NULL;

  regmatch_t *output = malloc(sizeof(regmatch_t) * (num_matches + 1));
  regex_t *preg = malloc(sizeof(regex_t));

  if (!output || !preg || regcomp(preg, pattern, cflags) != 0 ||
      regexec(preg, target, num_matches + 1, output, eflags) != 0) {
    free(output);
    free(preg);
    return NULL;
  }

  free(preg);
  return output;
}

int regmatch_has_match(regmatch_t *matches, int group_num) {
  if (!matches || matches[0].rm_eo == -1 || matches[0].rm_so == -1 ||
      matches[group_num].rm_eo == -1 || matches[group_num].rm_so == -1)
    return 0;
  return 1;
}

char *regmatch_get_match(regmatch_t *matches, int match_num, char *target) {
  int output_len = matches[match_num].rm_eo - matches[match_num].rm_so;
  char *output = malloc(output_len + 1);

  memcpy(output, target + matches[match_num].rm_so, output_len);
  output[output_len] = '\0';

  return output;
}