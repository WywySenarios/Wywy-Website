#!/bin/bash
set -e

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Error: No argument provided."
  echo "Usage: $0"
  exit 1
fi

echo "Preparing to backup..."

# lftp -d -u "$BACKUP_SERVER_USER,$BACKUP_SERVER_PASSWORD" ftp://$BACKUP_SERVER_HOST -e "put \"$1\"; exit"
curl -T "$1" ftp://$BACKUP_SERVER_USER:$BACKUP_SERVER_PASSWORD@$BACKUP_SERVER_HOST/

echo "Backup presumably succeeded!"

# set ftp:passive-mode on
# set ssl:verify-certificate no