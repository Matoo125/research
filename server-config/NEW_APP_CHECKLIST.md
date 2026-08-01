# Adding a new app to this VPS

Two patterns exist already, pick whichever fits:

- **Live process** (hireme, bookmarks-api): a long-running server (Bun/Node/etc.) behind
  Caddy's reverse proxy, run in place from the git checkout via systemd.
- **Static build** (lang): a build step produces static files, `rsync`'d to `/var/www/<domain>/`
  and served by Caddy directly — no running process.

Ports currently in use, pick something else: `3000` (bookmarks-api), `4020` (hireme), `19999`
(netdata, localhost-only). `2019`/`4317`/`8125` are netdata internals, leave alone.

## A. Live process (Bun/Node app)

1. Code lives in `/home/ubuntu/research/<app>/`, committed to the `research` repo.
2. Pick an unused port (see above).
3. Create `/etc/systemd/system/<app>.service`:
   ```ini
   [Unit]
   Description=<what it is>
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/research/<app>
   ExecStart=/home/ubuntu/.bun/bin/bun run <entrypoint>
   Environment=PORT=<port>
   Restart=on-failure
   RestartSec=2
   # EnvironmentFile=/home/ubuntu/research/<app>/.env   # only if it needs secrets

   [Install]
   WantedBy=multi-user.target
   ```
4. `sudo systemctl daemon-reload && sudo systemctl enable --now <app>.service`
5. Add to `/etc/caddy/Caddyfile`:
   ```
   <domain> {
       reverse_proxy localhost:<port>
   }
   ```
   `sudo systemctl reload caddy` — Caddy auto-provisions a Let's Encrypt cert once DNS resolves.
6. Point the domain's DNS A/AAAA record at this VPS's IP (at your registrar), if not already done.
7. Write `/home/ubuntu/deploy-<app>.sh` (see `deploy-hireme.sh`/`deploy-bookmarks-api.sh` for the
   template: `git pull --ff-only` [+ install deps if any] + `systemctl restart <app>` + a curl
   health check).

## B. Static site

1. Build step produces a static output dir (e.g. `dist/`).
2. `sudo rsync -a --delete --chown=caddy:caddy <dist>/ /var/www/<domain>/`
3. Add to Caddyfile:
   ```
   <domain> {
       root * /var/www/<domain>
       file_server
   }
   ```
   `sudo systemctl reload caddy`.
4. Write `/home/ubuntu/deploy-<app>.sh` (see `deploy-lang.sh`: build + rsync).

## Always, either pattern

- Run `./sync-from-live.sh` in this folder, then `git add`/`commit`/`push` — keeps
  `server-config/` (Caddyfile + systemd units) as a working reference of the live box. Add any
  new unit file paths to `sync-from-live.sh` itself too.
- Add an uptime monitor (UptimeRobot or similar) for the new domain.
- Add a section for it in `/home/ubuntu/SERVER.md`.
- If it holds real user data (a database, uploaded files), it needs a backup story — see
  `bookmarks-backup.timer`/`backup-db.sh` for the pattern (daily systemd timer, local rotation
  at minimum, off-box if the data matters more).
