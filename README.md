# Powder Roster

A self-hosted volunteer staff scheduling app for ski patrol, mountain ops, or any team that runs shift-based rosters. Built with FastAPI + React, deployable via Docker Compose.

---

## Features

- **Season management** — create seasons, set date ranges, activate/deactivate
- **Shift scheduling** — create individual shifts or bulk-generate recurring ones
- **Volunteer assignment** — managers assign volunteers; self-signup mode lets volunteers claim their own shifts
- **Roster & reporting** — per-volunteer shift counts, fill rates, CSV export
- **User management** — invite volunteers by email, edit roles, deactivate accounts
- **Notifications** — in-app bell with assignment alerts and upcoming unfilled shift warnings
- **Audit log** — full activity history visible to super admins
- **Profile settings** — users can update their name and change their password
- **Roles:** `super_admin`, `manager`, `volunteer`

---

## Requirements

- A Linux host (bare metal, VM, or LXC container) running **Debian 11/12** or **Ubuntu 22.04+**
- Root / sudo access
- Ports **3000** (app) and **8000** (API) available
- Internet access to pull Docker images and the repo on first install

No other dependencies — Docker is installed automatically by the install script.

---

## Installation

### One-liner (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alreadyded1/Powder-Roster/main/install.sh | bash
```

### Manual

```bash
git clone https://github.com/alreadyded1/Powder-Roster.git /opt/powder-roster
cd /opt/powder-roster
bash install.sh
```

The install script will:
1. Install Docker CE and the Compose plugin if not already present
2. Clone the repo to `/opt/powder-roster`
3. Generate a random `SECRET_KEY` and save it to `/opt/powder-roster/.env`
4. Build and start both containers
5. Print the URL and default login credentials

### After install

Open your browser to `http://<your-server-ip>:3000`

**Default credentials:**
| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `changeme` |

> **Change the admin password immediately** via the Profile page (top-right nav).

---

## Updating

```bash
bash /opt/powder-roster/update.sh
```

The update script will:
1. Check for new commits — exits early if already up to date
2. Show a summary of changes being applied
3. Rebuild only the containers that changed
4. Remove dangling Docker images
5. Print container status when done

---

## Managing the app

All commands should be run from `/opt/powder-roster`.

```bash
# View running containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (one service)
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down

# Start
docker compose up -d

# Restart a single service
docker compose restart backend
```

---

## Configuration

Settings are read from `/opt/powder-roster/.env`. This file is created automatically during install.

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(random, generated on install)* | JWT signing secret — keep this private |

To change the secret key after install:

```bash
# Edit the .env file
nano /opt/powder-roster/.env

# Restart the backend to apply changes
docker compose restart backend
```

> **Note:** Changing `SECRET_KEY` will invalidate all active sessions — all users will need to log in again.

---

## Data & Backups

The database is a SQLite file stored in a named Docker volume (`db_data`), mounted at `/app/data/powder_roster.db` inside the backend container.

**Backup:**
```bash
docker cp powder-roster-backend:/app/data/powder_roster.db ./backup-$(date +%F).db
```

**Restore:**
```bash
docker cp ./backup-2025-01-01.db powder-roster-backend:/app/data/powder_roster.db
docker compose restart backend
```

---

## Proxmox LXC Setup (recommended)

1. Create an **Ubuntu 22.04** unprivileged container in Proxmox (1 CPU, 1 GB RAM minimum; 2 GB recommended)
2. Give the container internet access and note its IP
3. Open a shell and run the one-liner install command above

For external access, point a reverse proxy (e.g. Nginx Proxy Manager or Caddy) at `http://<lxc-ip>:3000`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, passlib/bcrypt, python-jose |
| Database | SQLite (default) — PostgreSQL-ready via `DATABASE_URL` |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Axios |
| Auth | JWT bearer tokens |
| Deployment | Docker Compose, Nginx (frontend static serving + API proxy) |

---

## Uninstall

```bash
docker compose -f /opt/powder-roster/docker-compose.yml down -v
rm -rf /opt/powder-roster
```

> The `-v` flag removes the database volume. Omit it if you want to keep your data.
