# Catalog Quest

A short browser game for practicing **HTTP**, **REST**, **AJAX**, and **SSR**. You compose real requests against a Node.js + Express server. The server — not the browser — decides whether a request solves the current stage.

## Requirements

- [Node.js](https://nodejs.org/) **18 or newer** (includes `npm`)
- A terminal in the **project root** (the folder that contains `package.json` and `server.js`)

This is a server-side app. Do **not** open the HTML files directly, and do **not** use GitHub Pages.

## Install and run

```bash
npm install
npm start
```

When the server is ready, the terminal prints:

```text
Catalog Quest listening on http://localhost:3000
```

Open this address in the browser:

**http://localhost:3000**

| Page | Address |
| --- | --- |
| Game | http://localhost:3000/ |
| Schemas | http://localhost:3000/schemas |

Stop the server with `Ctrl+C`.

Optional auto-restart while developing:

```bash
npm run dev
```

If `npm` or `node` is not recognized, Node.js is not installed (or not on `PATH`). Install it, close and reopen the terminal, then run the commands again from this folder.

If port 3000 is already in use, stop the other process, or start with a different port:

```bash
set PORT=3001
npm start
```

On macOS/Linux use `PORT=3001 npm start` instead. Then open `http://localhost:3001`.

## Routes

| Path | What it is |
| --- | --- |
| `/` | Game page (EJS, SSR). Stage changes stay on this page (AJAX). |
| `/schemas` | SSR page with resource field names and types. |
| `/api/books` | Books collection |
| `/api/books/:id` | One book |
| `/api/books/:id/reviews` | Reviews of a book (relationship) |
| `/api/reviews` | Reviews collection |
| `/api/game/stages` | Public stage briefings (no answers) |
| `/api/game/reset` | Restore in-memory catalog from `data/seed.json` |

All API traffic lives under `/api`. Data is kept in memory (loaded from JSON). Create / update / delete change that memory until the process restarts or you reset.

## How grading works

Every game request sends header `X-Game-Stage` with the current stage id. The server compares method, path, query parameters, and body to the solution stored in `game/stages.js`. Client JavaScript never contains the answers.

When that header is present, JSON responses look like:

```json
{
  "game": { "correct": true, "message": "...", "stageId": 1 },
  "data": { }
}
```

`data` is the real REST payload. The HTTP status code is the real API status (for example **404** on the missing-book stage).

## Resources

- **books**: `id`, `title`, `author`, `genre`, `year`, `available`, `copies`
- **reviews**: `id`, `bookId`, `reviewer`, `rating`, `comment`

Query parameters on `GET /api/books` actually filter and sort (`genre`, `author`, `available`, `sort=year|-year|title`). Nested reviews accept `minRating`.

## Constraints followed

- Vanilla JavaScript only on the client (`public/js/game.js`)
- CSS in `public/css/style.css`
- EJS for `/` and `/schemas`
- REST methods and paths (no `/deleteBook` style routes)
- Responsive layout (desktop and mobile)
- No database

## Submit notes

Upload the project to a **public** GitHub repository. Zip the same files for Moodle **without** the `node_modules` folder. Pair submission still needs both names in the Moodle comment.
