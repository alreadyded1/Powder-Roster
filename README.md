# Powder Roster

A self-hosted volunteer staff scheduling app for ski patrol, mountain ops, or any team that runs shift-based rosters. Built with FastAPI + React, runs natively via systemd and nginx.

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
- Port **80** available
- Internet access to pull the repo and packages on first install

No Docker required — the install script sets everything up natively.

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
1. Install Python 3, Node.js 20, and nginx via apt
2. Clone the repo to `/opt/powder-roster`
3. Create a `powder-roster` system user
4. Create a Python virtualenv and install backend dependencies
5. Run database migrations and seed the default admin account
6. Build the React frontend
7. Configure nginx to serve the app on port 80
8. Create and start a `powder-roster` systemd service for the backend

### After install

Open your browser to `http://<your-server-ip>`

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
3. Update Python dependencies
4. Run any new database migrations
5. Rebuild the frontend
6. Restart the backend service and reload nginx

---

## Managing the app

```bash
# Check status
systemctl status powder-roster

# View backend logs
journalctl -u powder-roster -f

# Restart backend
systemctl restart powder-roster

# Stop / start
systemctl stop powder-roster
systemctl start powder-roster

# Nginx logs
journalctl -u nginx -f
```

---

## Configuration

Settings are read from `/opt/powder-roster/.env`. This file is created automatically during install.

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(random, generated on install)* | JWT signing secret — keep this private |

To change the secret key after install:

```bash
nano /opt/powder-roster/.env
systemctl restart powder-roster
```

> **Note:** Changing `SECRET_KEY` will invalidate all active sessions — all users will need to log in again.

---

## Data & Backups

The database is a SQLite file at `/opt/powder-roster/backend/powder_roster.db`.

**Backup:**
```bash
cp /opt/powder-roster/backend/powder_roster.db ~/backup-$(date +%F).db
```

**Restore:**
```bash
systemctl stop powder-roster
cp ~/backup-2025-01-01.db /opt/powder-roster/backend/powder_roster.db
chown powder-roster:powder-roster /opt/powder-roster/backend/powder_roster.db
systemctl start powder-roster
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, FastAPI, SQLAlchemy 2.0, Alembic, passlib/bcrypt, python-jose |
| Database | SQLite (default) — PostgreSQL-ready via `DATABASE_URL` |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Axios |
| Auth | JWT bearer tokens |
| Deployment | systemd (backend), nginx (frontend + reverse proxy) |

---

## Uninstall

```bash
systemctl stop powder-roster
systemctl disable powder-roster
rm /etc/systemd/system/powder-roster.service
systemctl daemon-reload
rm /etc/nginx/sites-enabled/powder-roster
rm /etc/nginx/sites-available/powder-roster
systemctl reload nginx
rm -rf /opt/powder-roster
userdel powder-roster
```
