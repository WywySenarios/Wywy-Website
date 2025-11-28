#!/bin/bash
# Source - https://stackoverflow.com/a
# Posted by 3wordchant
# Retrieved 2025-11-27, License - CC BY-SA 4.0

set -e

file_env() {
   local var="$1"
   local fileVar="${var}_FILE"
   local def="${2:-}"

   if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
      echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
      exit 1
   fi
   local val="$def"
   if [ "${!var:-}" ]; then
      val="${!var}"
   elif [ "${!fileVar:-}" ]; then
      val="$(< "${!fileVar}")"
   fi
   export "$var"="$val"
   unset "$fileVar"
}

file_env "CLOUDFLARE_API_TOKEN"

npm i

npm run astro build

npx wrangler@latest deploy