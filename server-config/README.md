# server-config

Reference copies of the live VPS config, so a disk loss or rebuild doesn't mean re-deriving
this from memory. The **running** copies on the box are the source of truth day-to-day
(`/etc/caddy/Caddyfile`, `/etc/systemd/system/*.service`, `*.timer`) — this folder is a
backup/reference, not something the box reads from.

No secrets live here: `bookmarks-api.service` references `bookmarks/api/.env` by path only,
never its contents (that file stays gitignored).

## Updating this folder after a live config change

```bash
./sync-from-live.sh
git diff   # review before committing
```

See `/home/ubuntu/SERVER.md` for the full architecture writeup.
