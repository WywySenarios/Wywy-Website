#include <ctype.h>
#include <string.h>

/**
 * Attempts to convert a given string to snake case.
 * @param src The string to convert. This function does not free src, but it
 * does modify it in place.
 */
void to_snake_case(char *src) {
  size_t src_len = strlen(src);
  for (unsigned i = 0; i < src_len; i++) {
    switch (src[i]) {
    case ' ':
    case '-':
    case '.':
      src[i] = '_';
      break;
    }
  }
}

/**
 * Attempts to convert a given string to snake case.
 * @param src The string to convert. This function does not free src, but it
 * does modify it in place.
 */
void to_lower_snake_case(char *src) {
  size_t src_len = strlen(src);
  for (unsigned i = 0; i < src_len; i++) {
    switch (src[i]) {
    case ' ':
    case '-':
    case '.':
      src[i] = '_';
      break;
    default:
      src[i] = tolower((unsigned char)src[i]); // @WARNING why unsigned?
      break;
    }
  }
}