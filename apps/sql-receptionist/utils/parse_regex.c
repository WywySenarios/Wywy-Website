/**
 * Helper library for running regex and storing output into strings. Iterator
 * style. Does not have a has_next() function.
 */

#include "parse_regex.h"
#include <regex.h>
#include <stdlib.h>
#include <string.h>

/**
 * Creates a new regex iterator based on the given pattern. Returns NULL on
 * failure.
 * @param pattern the pattern for the new regex iterator. This string is not
 * freed.
 * @param num_matches the upper bound of number of catpuring groups you expect
 * to get.
 * @param cflags for regcomp.
 * @return the pointer to the new regex iterator.
 */
struct regex_iterator *create_regex_iterator(char *pattern, int num_matches,
                                             int cflags) {
  struct regex_iterator *output = malloc(sizeof(struct regex_iterator));

  output->nmatch = num_matches + 1;
  output->matches = malloc(sizeof(regmatch_t) * num_matches);
  if (regcomp(output->preg, pattern, cflags) != 0) {
    free(output->matches);
    free(output);
    return NULL;
  }

  return output;
}

/**
 * Changes the target string of the given regex_iterator. If there was an old
 * target, that string is not freed.
 * @param iter the regex_iterator to modify.
 * @param new_target the new target string.
 */
void regex_iterator_load_target(struct regex_iterator *iter, char *new_target) {
  iter->target = new_target;
}

/**
 * Replaces the old target string of the given regex_iterator with the new
 * target string. Attempts to free the old target string.
 * @param iter the regex_iterator to modify.
 * @param new_target the new target string.
 */
void regex_iterator_replace_target(struct regex_iterator *iter,
                                   char *new_target) {
  if (iter->target)
    free(iter->target);
  iter->target = new_target;
}

/**
 * Attempts to query the given target. Returns REG_NOMATCH when there is no
 * target. May fail if the regex_iterator is not valid. This does not modify the
 * regex_iterator's target string.
 * @param iter the regex_iterator to run the query on.
 * @param eflags the eflags to pass into regexec.
 * @return the result of regexec.
 */
int regex_iterator_peek(struct regex_iterator *iter, int eflags) {
  if (!iter->target)
    return REG_NOMATCH;

  if (iter->cur)
    return regexec(iter->preg, iter->cur, iter->nmatch + 1, iter->matches,
                   eflags);
  else
    return regexec(iter->preg, iter->target, iter->nmatch + 1, iter->matches,
                   eflags);
}

/**
 * Attempts to query the given target. Returns REG_NOMATCH when there is no
 * target. May fail if the regex_iterator is not valid. This does not modify the
 * regex_iterator's target string.
 * @param iter the regex_iterator to run the query on.
 * @param eflags the eflags to pass into regexec.
 * @return the result of regexec.
 */
int regex_iterator_match_next(struct regex_iterator *iter, int eflags) {
  if (!iter->target)
    return REG_NOMATCH;

  // make sure there is a valid cur to use.
  if (!iter->cur)
    iter->cur = iter->target;

  int output = regexec(iter->preg, iter->target, iter->nmatch + 1,
                       iter->matches, eflags);

  // advance cur
  iter->cur += iter->matches[0].rm_eo;

  return output;
}

/**
 * Gets the ith match number (0 -> entire string that was regex'd). May behave
 * unexpectedly if match_num is invalid. May fail if the iterator never tried to
 * match or if the iterator is invalid.
 * @param iter the related regex iterator
 * @param match_num the match that will be extracted
 */
char *regex_iterator_get_match(struct regex_iterator *iter, int match_num) {
  if (!(0 <= match_num && match_num < iter->nmatch))
    return NULL;

  int output_len =
      iter->matches[match_num].rm_eo - iter->matches[match_num].rm_so;
  char *output = malloc(output_len + 1);

  memcpy(output, iter->target + iter->matches[match_num].rm_so, output_len);
  output[output_len] = '\0';

  return output;
}

/**
 * Frees all pointers associated with a given regex iterator. Also frees the
 * target string and the iterator itself
 * @param iter the regex_iterator to free.
 */
void free_regex_iterator(struct regex_iterator *iter) {
  if (!iter)
    return;

  if (iter->preg)
    regfree(iter->preg);
  if (iter->matches)
    free(iter->matches);
  if (iter->target)
    free(iter->target);
  free(iter);
}