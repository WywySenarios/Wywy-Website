#include <jansson.h>
#include <regex.h>
#include <string.h>

int check_integer(const json_t *json) { return json_is_integer(json); }
int check_string(const json_t *json) { return json_is_string(json); }
int check_real(const json_t *json) { return json_is_real(json); }
int check_bool(const json_t *json) { return json_is_boolean(json); }
/**
 * Checks whether or not a given value is in the format xxxx-xx-xx
 * @param json The value to validate.
 * @return 0 if it is not a valid date, 1 if it's date-like
 */
int check_datelike(const json_t *json) {
  if (json_is_string(json)) {
    const char *text = json_string_value(json);
    regex_t check_regex;
    regcomp(&check_regex, "'[0-9]{1,4}-[0-9]{2}-[0-9]{2}'", REG_EXTENDED);
    // Alternative pattern (does not account for february 29):
    // xxxx-[1<=num<=12]-[valid date within that month]:
    // ([0-9]{1,4})-?((02)-?([0]|[12][0-9])|(01|03|05|07|08|10|12)-?(0[1-9]|[12][0-9]|3[01])|(04|06|09|11)-?(0[1-9]|[12][0-9]|30))

    regmatch_t check_matches[4];

    if (regexec(&check_regex, text, 4, check_matches, 0) == REG_NOMATCH) {
      regfree(&check_regex);
      return 0;
    }

    if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1) {
      regfree(&check_regex);
      return 0;
    }

    // make sure it's just a datelike string and nothing else is after that.
    int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
    regfree(&check_regex);
    if (match_size == strlen(text)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}
/**
 * Checks whether or not a given value is in the format of xx:xx:xxZ or TxxxxxxZ
 * or xx:xx:xx.x... or Txxxxxx...
 */
int check_timelike(const json_t *json) {
  if (json_is_string(json)) {
    const char *text = json_string_value(json);
    regex_t check_regex;
    regcomp(&check_regex,
            "'([0-9]{2}:[0-9]{2}:[0-9]{2}|[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{1,6}"
            "|T[0-9]{6}|T[0-9]{6}.[0-9]{1,6})'",
            REG_EXTENDED);

    regmatch_t check_matches[2];

    if (regexec(&check_regex, text, 2, check_matches, 0) == REG_NOMATCH) {
      regfree(&check_regex);
      return 0;
    }

    if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1) {
      regfree(&check_regex);
      return 0;
    }

    // make sure it's just a timelike string and nothing else is after that.
    int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
    regfree(&check_regex);
    if (match_size == strlen(text)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}
int check_timestamplike(const json_t *json) {
  if (json_is_string(json)) {
    const char *text = json_string_value(json);
    regex_t check_regex;
    regcomp(&check_regex,
            "'([0-9]{1,4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}|[0-9]{"
            "2}:[0-9]{2}:[0-9]{2}.[0-9]{1,6}|T[0-9]{6}|T[0-9]{6}.[0-9]{1,6})'",
            REG_EXTENDED);

    regmatch_t check_matches[2];

    if (regexec(&check_regex, text, 2, check_matches, 0) == REG_NOMATCH) {
      regfree(&check_regex);
      return 0;
    }

    if (check_matches[0].rm_eo == -1 || check_matches[0].rm_so == -1) {
      regfree(&check_regex);
      return 0;
    }

    // make sure it's just a timelike string and nothing else is after that.
    int match_size = check_matches[0].rm_eo - check_matches[0].rm_so;
    regfree(&check_regex);
    if (match_size == strlen(text)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}