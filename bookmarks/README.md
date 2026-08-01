# Nexus Bookmark Manager

A complete bookmark management system featuring a REST API, a premium web frontend (with a cyberpunk/glassmorphism aesthetic), and a fully functional command-line interface (CLI).

Both the Web Frontend and the CLI connect to the same SQLite-backed Express API, meaning you can add a link via the CLI and instantly view it in the browser, or vice-versa!

## 🚀 Quick Start (Running the Server)

The core of the application is the API server, which also serves the web frontend.

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```
2. **Install dependencies (if you haven't already):**
   ```bash
   npm install
   ```
3. **Run the server:**
   ```bash
   node server.js
   ```
   *(The server runs on `http://localhost:3000` by default).*

---

## 🌐 Web Frontend

The web frontend is served automatically by the API. 
Once the server is running, simply open your web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

From there, you can register a new account, log in, and manage your bookmarks through the aesthetic UI.

---

## 💻 CLI Client

Yes! You can still use the CLI completely independently. The CLI stores your JWT token locally in your home directory (`~/.bm-cli-token`), so you only need to log in once.

### Setup
1. **Navigate to the CLI directory:**
   ```bash
   cd client
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```

### Usage
You can execute the CLI by running `./index.js` directly from the `client/` folder. 

**Authentication:**
```bash
# Register a new user
./index.js register <username> <password>

# Login (saves token locally)
./index.js login <username> <password>

# Logout (clears local token)
./index.js logout
```

**Managing Bookmarks:**
```bash
# Add a single bookmark
./index.js add "https://github.com" "GitHub" "Code hosting"

# Add a bookmark with tags (comma-separated)
./index.js add "https://github.com" "GitHub" "Code hosting" "dev,git"

# List all your bookmarks
./index.js list

# List only bookmarks tagged "dev"
./index.js list --tag dev

# List all tags with usage counts
./index.js tags

# Delete a bookmark by its ID
./index.js delete 1

# Bulk add bookmarks from a JSON file
./index.js add-bulk path/to/bookmarks.json
```

*(Tip: For bulk additions, the JSON file should contain an array of objects looking like `[{"url":"...", "title":"...", "description":"...", "tags":["dev","git"]}]`)*

---

## 🏷️ Tags

Bookmarks can have any number of tags. Tags are per-user, case-insensitive
("JS" and "js" collapse to one tag), and created automatically the first
time you use them - no separate "create tag" step needed.

- **Web:** add comma-separated tags in the "Tags" field when adding a
  bookmark. Click any tag (on a bookmark or in the filter bar above the
  list) to filter the list down to that tag; click it again to clear.
- **CLI:** pass a comma-separated tag list as the 4th argument to `add`,
  filter `list` with `--tag <name>`, or run `tags` to see every tag
  you've used along with how many bookmarks carry it.
- **API:** `GET /bookmarks?tag=<name>` filters, `GET /tags` lists all
  tags with counts, and `POST /bookmarks` accepts a `tags: string[]`
  field (on each object, for bulk inserts too).
