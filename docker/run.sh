#!/bin/bash
# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Error: No argument provided." >&2
  echo "Usage: $0 <prod | dev>" >&2
  exit 1
fi

endflags=""

# Check for flags
while getopts "b" opt;
do
    case "${opt}" in
    b)
        endflags="${endflags} --build"
        ;;
    *)
        echo "Invalid flag \"-${opt}\". Expected -b for build." &>2
        exit 1
        ;;
    esac
done

# shift args so that position arguments make sense
shift $((OPTIND-1))

case "$1" in
    prod)
        case "$2" in 
            astro) docker compose -f prod/docker-compose.astro.yml up${endflags}
        esac
        docker compose -f docker-compose.prod.yml up${endflags}
        ;;
    dev)
        docker compose -f docker-compose.dev.yml up --watch${endflags}
        ;;
    *)
        echo "Error: Invalid argument '$1'. Expected 'prod' or 'dev'"
        exit 1
        ;;
esac