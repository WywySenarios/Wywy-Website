#!/bin/sh
# Source upstream environment variables from the control repo.
# No environment variables are hardcoded here — everything comes from config.
CONFIG_DIR="${CONFIG_DIR:-/etc/Wywy-Website-Control/config}"

set -a
[ -f "$CONFIG_DIR/.env" ]         && . "$CONFIG_DIR/.env"
[ -f "$CONFIG_DIR/website/.env" ] && . "$CONFIG_DIR/website/.env"
set +a
