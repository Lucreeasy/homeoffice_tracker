> **Note: this app is vibe coded.** It was built conversationally with an AI assistant and has not been formally reviewed or audited. Use it accordingly.

# Homeoffice Tracker

A tiny internal web app where colleagues record, for each weekday of the current week, whether they are working from **Homeoffice** or **In Office**. A weekly overview shows at a glance who is where.

## Features

- Pick your name from a list (no login, no passwords).
- Add your name from the entry page via "+ Neuen Namen hinzufügen" if it is not in the list yet.
- Each day defaults to a whole day (Homeoffice / In Office). A small button splits the day into Vormittag (morning) and Nachmittag (afternoon), each set independently; the same button merges it back.
- Click an already selected option again to clear it.
- Overview page with everyone's week as a colour-coded grid (refreshes automatically).
- Only the current week (Mon-Fri) is shown and editable. This is enforced server-side.

## Run with Docker

```bash
docker compose up -d --build
```

Then open <http://localhost:3001>. The overview is at `/overview.html`.

The host port is set in `docker-compose.yml` (`3001:3000`); the app listens on port 3000 inside the container.

## Run without Docker

Requires Node.js 20+.

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

## Data

Everything is stored as plain JSON files in `./data/`, which is mounted into the container as a volume, so data survives restarts and rebuilds.

| File | Purpose |
| --- | --- |
| `data/team.json` | List of team members (`{ "members": [{ "id": "...", "name": "..." }] }`) |
| `data/homeoffice-data.json` | Entries, grouped by ISO week (created automatically; delete it to reset all entries) |

`team.json` is re-read on every request, so you can edit it by hand without restarting the container. Names added through the UI are written to the same file.

Configuration via environment variables: `PORT` (default `3000`), `DATA_FILE`, `TEAM_FILE`.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/team` | List team members |
| `POST` | `/api/team` | Add a member (`{ "name": "..." }`) |
| `GET` | `/api/week` | Current week: dates, members and all entries |
| `PUT` | `/api/week/:memberId/:date` | Set an entry: `{ "mode": "full", "value": "homeoffice" \| "ausserhalb" }` or `{ "mode": "half", "am": ..., "pm": ... }` |
| `DELETE` | `/api/week/:memberId/:date` | Clear an entry |
| `GET` | `/api/health` | Health check |

The internal value `ausserhalb` is what the UI shows as "In Office".

## Caveats

- There is no authentication. Anyone who can reach the app can edit anyone's entries, so it is meant for a small, trusted team on an internal network.
- Storage is a single JSON file with serialized writes. Run only one container instance per data directory.
