#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Powder Roster — Update Script
# Run as root:  bash /opt/powder-roster/update.sh
# ─────────────────────────────────────────────────────────────────────────────

INSTALL_DIR="/opt/powder-roster"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && die "Please run as root (sudo bash update.sh)"

[[ ! -d "$INSTALL_DIR/.git" ]] && die "Powder Roster not found at $INSTALL_DIR. Run install.sh first."

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Powder Roster Updater          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

cd "$INSTALL_DIR"

# ── Pull latest code ──────────────────────────────────────────────────────────
info "Pulling latest code..."
git fetch --quiet origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [[ "$LOCAL" == "$REMOTE" ]]; then
    success "Already up to date ($(git rev-parse --short HEAD))"
    echo ""
    docker compose ps
    echo ""
    exit 0
fi

PREV_SHORT=$(git rev-parse --short HEAD)
git pull --quiet origin main
NEW_SHORT=$(git rev-parse --short HEAD)
success "Updated $PREV_SHORT → $NEW_SHORT"

# ── Show what changed ─────────────────────────────────────────────────────────
echo ""
info "Changes:"
git log --oneline "${LOCAL}..${REMOTE}" | sed 's/^/    /'
echo ""

# ── Rebuild and restart ───────────────────────────────────────────────────────
info "Rebuilding containers..."
docker compose --env-file .env up -d --build

# ── Remove dangling images ────────────────────────────────────────────────────
DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null)
if [[ -n "$DANGLING" ]]; then
    info "Removing unused images..."
    docker rmi $DANGLING &>/dev/null || true
fi

echo ""
success "Update complete!"
echo ""
docker compose ps
echo ""
