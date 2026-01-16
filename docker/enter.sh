#!/bin/bash
# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Error: No argument provided."
  echo "Usage: $0 <astro|sqlr|pgres>"
  exit 1
fi

case "$1" in
  astro)
    sudo docker exec -it wywywebsite_astro-dev-server bash
    ;;
  sqlr)
    sudo docker exec -it wywywebsite_sql-receptionist-dev-server bash
    ;;
  pgres)
    sudo docker exec -it wywywebsite_postgres bash
    ;;
  create_tables)
    sudo docker run -it --rm docker-wywywebsite_create_tables bash
    ;;
  *)
    echo "Error: Invalid argument '$1'. Expected 'astro', 'sqlr', or 'pgres'."
    exit 1
    ;;
esac
