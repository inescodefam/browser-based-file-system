# File system explorer

A simple file system API and web UI for creating folders and files, searching them, and deleting them.

## Tech stack

- NestJS
- React (Vite)
- Mantine
- React Query
- PostgreSQL (ltree)
- Swagger
- TypeScript

## Getting started (Docker)

You need [Docker](https://docs.docker.com/get-docker/) with Compose.
In the root folder:
```bash
docker compose up --build
```

Then open:

- App: http://localhost:8080
- API docs: http://localhost:3000/api/docs

Stop with `Ctrl+C`. Remove containers and the database volume with `docker compose down -v`.

## Running tests

```bash
cd backend && npm test && npm run test:api
cd frontend && npm test
```

## API documentation

Swagger UI: http://localhost:3000/api/docs (also when running in Docker)

## Assumptions and trade-offs

_TODO_

## What I would improve with more time

_TODO_
