#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp /etc/caddy/Caddyfile "$DIR/Caddyfile"
cp /etc/netdata/netdata.conf "$DIR/netdata.conf"
for f in /etc/systemd/system/hireme.service \
         /etc/systemd/system/hireme-scrape.service \
         /etc/systemd/system/hireme-scrape.timer \
         /etc/systemd/system/bookmarks-api.service \
         /etc/systemd/system/debsums-check.service \
         /etc/systemd/system/debsums-check.timer \
         /etc/systemd/system/bookmarks-backup.service \
         /etc/systemd/system/bookmarks-backup.timer; do
  cp "$f" "$DIR/systemd/$(basename "$f")"
done

echo "Synced live config into $DIR — review with 'git diff' before committing."
