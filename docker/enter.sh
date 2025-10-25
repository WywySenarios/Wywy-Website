#!/bin/bash
# Check if a second argument is provided
if [ -z "$1" ]; then
  echo "Error: No argument provided."
  echo "Usage: $0 <first_arg> <astro|sqlr|pgres>"
  exit 1
fi

case "$1" in
  astro)
    sudo docker run -it --rm -p 4321:4321 -v "../apps/astro-app:/apps/astro-app" docker-astro-app /bin/sh
    ;;
  sqlr)
    sudo docker run -it --rm -p 2523:2523 docker-sql-receptionist /bin/sh
    ;;
  pgres)
    sudo docker run -it --rm -p 5432:5432 -v "postgres-db:/var/lib/postgresql" docker-postgres /bin/sh
    ;;
  *)
    echo "Error: Invalid argument '$2'. Expected 'astro', 'sqlr', or 'pgres'."
    exit 1
    ;;
esac
