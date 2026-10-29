# File system explorer

A simple file system API and web UI for creating folders and files, searching them, and deleting them.

Backend and frontend live in one Git repo so you can clone once, but they are two apps and can be deployed separately. You need Node.js 24.

## Instructions to run locally

Copy [`.env.example`](.env.example) to `.env` in the repo root first. Both apps read that file for things like `SEARCH_LIMIT`, `NAME_MAX_LENGTH`, `VITE_API_URL`, and database settings.

```bash
cp .env.example .env
```

By default `.env` sets `DB_DRIVER=memory`, so the API keeps data in memory and you do not need Postgres. That is the easiest way to try the app on your machine.

Start the API and the UI in two terminals:

```bash
cd backend
npm ci
npm run start:dev
```

```bash
cd frontend
npm ci
npm run dev
```

Then open:

- App: http://localhost:5173
- API docs: http://localhost:3000/api/docs

There is no extra “debug mode” for the frontend. `npm run dev` already runs Vite with hot reload; you can use the browser’s developer tools if you want to inspect it. On the backend, `npm run start:dev` is enough to run the API while you work. `npm run start:debug` only adds the Node inspector (port 9229, `chrome://inspect`) if you actually want to attach a debugger.

### Docker

Docker is a full stack: Postgres, the API, and the UI. You do **not** switch `.env` from memory to Postgres for this. Compose ignores that local file and sets `DB_DRIVER=postgres` itself, with a Postgres 16 container and a named volume so data survives restarts.

You need [Docker](https://docs.docker.com/get-docker/) with Compose. From the repo root:

```bash
docker compose up --build
```

Then open:

- App: http://localhost:8080
- API docs: http://localhost:3000/api/docs

Stop with `Ctrl+C` or `Control+C` on Mac. Remove containers and the database volume with `docker compose down -v`.

If you want Postgres **without** Docker, install Postgres 16 locally, create a database that matches `DATABASE_URL` in `.env`, and set `DB_DRIVER=postgres`.

## Running tests

```bash
cd backend && npm test && npm run test:api
cd frontend && npm test
```

Backend Postgres repository tests run only when `TEST_DATABASE_URL` is set; otherwise they are skipped. CI sets that URL.

## API documentation

Swagger UI: http://localhost:3000/api/docs (local or Docker)

## Assumptions and trade-offs

- This is not a full Dropbox. The solution is a folder tree, files that are only a name, search, and delete, not uploads, sharing, or a polished file manager. I left out drag-and-drop of real files into folders, because there is no file content to upload.
- I kept the backend and frontend in one repository so it is easy to clone once and run. They are still two apps.
- Files can only be created inside a folder, not at the top level, matching “create new files in the folders”. A file is just its name, so the UI only shows the name.
- Names have a max length (`NAME_MAX_LENGTH`, default 50). Folders may use letters, numbers, spaces and hyphens. Files are the same, plus one extension (`report.pdf`). I kept names strict so characters that look like paths cannot sneak into a name.
- Names are unique in a folder ignoring case, like macOS or Windows: you can keep `Report.pdf`, but you cannot also create `report.pdf` next to it.
- “Search files by their exact name” means the whole name, case-sensitive, not a partial match. Typing `REPORT.TXT` and pressing Enter will not find `Report.txt`. Prefix suggestions ignore case, so typing `rep` still offers `Report.txt`. When a parent folder is selected, search and suggestions look in that folder **and its subfolders**, not only the immediate children. Suggestions return at most `SEARCH_LIMIT` files (default 10).
- Folders have their own URL (`/folders/<uuid>`), with breadcrumbs at the top. That is closer to a real file manager: you can go back through the path, refresh without losing where you are, and send someone a link to a specific folder. Search also lives in the query string, so a search can be shared the same way.
- On the frontend I cache folder listings and search results for a short time so expanding the same folder or repeating a search does not hit the API every time. The search box also waits until you pause typing (half a second) before it asks for suggestions or updates the URL, so we do not fire a request on every keystroke.
- No authentication, as requested. 
- Deleting a folder deletes everything inside it.

## What I would improve with more time

To make it feel more like Dropbox I would store real file content (S3 or MinIO) and let you drag files from the desktop into a folder. I think that would be the interesting next step, but it is outside this brief.

The HTTP API already handles concurrent requests. What is missing if several people used the same tree is live updates, so another browser would see creates and deletes without a refresh (WebSocket or SSE).

I also thought about a clickable path on each search hit (jump to the parent folder), rename/edit, and Playwright tests against the running app. I left those out because they felt out of scope for this task.

I would still like to deploy it: the React app on a static host (Vercel or similar), and the Nest API plus Postgres on something that runs a long-lived Node process (Railway, Render, or Fly). The API as it is written is not a good fit for Vercel serverless.
