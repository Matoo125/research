#!/bin/bash
set -euo pipefail

DB="/home/ubuntu/research/bookmarks/api/bookmarks.db"
BACKUP_DIR="/var/backups/bookmarks-api"
STAMP="$(date +%F)"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB" ".backup '$BACKUP_DIR/bookmarks-$STAMP.db'"
gzip -f "$BACKUP_DIR/bookmarks-$STAMP.db"

find "$BACKUP_DIR" -name "bookmarks-*.db.gz" -mtime "+$RETENTION_DAYS" -delete

echo "Backed up $DB to $BACKUP_DIR/bookmarks-$STAMP.db.gz"
