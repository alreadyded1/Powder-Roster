#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Powder Roster — Install Script
# Tested on Debian 11/12 and Ubuntu 22.04 LXC containers
# Run as root:  bash install.sh
# ─────────────────────────────────────────────────────────────────────────────

REPO_URL="https://github.com/alreadyded1/Powder-Roster.git"
INSTALL_DIR="/opt/powder-roster"
SERVICE_USER="powder-roster"
NODE_MAJOR=20

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Please run as root (sudo bash install.sh)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Powder Roster Installer        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── System packages ───────────────────────────────────────────────────────────
info "Installing system packages..."
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip nginx curl
success "System packages ready"

# ── Node.js ───────────────────────────────────────────────────────────────────
NODE_OK=false
if command -v node &>/dev/null; then
    NODE_VER=$(node -e "console.log(process.versions.node.split('.')[0])")
    [[ "$NODE_VER" -ge 18 ]] && NODE_OK=true
fi

if [[ "$NODE_OK" == "false" ]]; then
    info "Installing Node.js ${NODE_MAJOR}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - &>/dev/null
    apt-get install -y -qq nodejs
    success "Node.js $(node --version) installed"
else
    success "Node.js $(node --version) already present"
fi

# ── Clone repo ────────────────────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
    warn "Directory $INSTALL_DIR already exists — run update.sh instead."
    exit 0
fi

info "Cloning repository to $INSTALL_DIR..."
git clone --quiet "$REPO_URL" "$INSTALL_DIR"
success "Repository cloned"

# ── Service user ──────────────────────────────────────────────────────────────
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd --system --no-create-home --shell /bin/false "$SERVICE_USER"
fi

# ── Generate .env ─────────────────────────────────────────────────────────────
ENV_FILE="$INSTALL_DIR/.env"
SECRET=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)
cat > "$ENV_FILE" <<EOF
SECRET_KEY=${SECRET}
EOF
chmod 600 "$ENV_FILE"
success ".env created with a random SECRET_KEY"

# ── Python virtualenv + dependencies ──────────────────────────────────────────
info "Setting up Python environment..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install --quiet -r "$INSTALL_DIR/backend/requirements.txt"
success "Python dependencies installed"

# ── Database migrations ───────────────────────────────────────────────────────
info "Running database migrations..."
cd "$INSTALL_DIR/backend"
"$INSTALL_DIR/venv/bin/alembic" upgrade head
success "Migrations complete"

# ── Seed initial admin ────────────────────────────────────────────────────────
info "Seeding database..."
"$INSTALL_DIR/venv/bin/python" seed.py

# ── Set ownership ─────────────────────────────────────────────────────────────
chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/backend/powder_roster.db" 2>/dev/null || true
chown "$SERVICE_USER:$SERVICE_USER" "$ENV_FILE"

# ── Build frontend ────────────────────────────────────────────────────────────
info "Building frontend..."
cd "$INSTALL_DIR/frontend"
npm install
VITE_API_URL=/api npm run build
success "Frontend built"

# ── Configure nginx ───────────────────────────────────────────────────────────
info "Configuring nginx..."
cp "$INSTALL_DIR/frontend/nginx.conf" /etc/nginx/sites-available/powder-roster
ln -sf /etc/nginx/sites-available/powder-roster /etc/nginx/sites-enabled/powder-roster
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx
success "Nginx configured"

# ── Systemd service ───────────────────────────────────────────────────────────
info "Creating systemd service..."
cat > /etc/systemd/system/powder-roster.service <<SERVICE_EOF
[Unit]
Description=Powder Roster Backend
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}/backend
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=${INSTALL_DIR}/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable --now powder-roster
success "Service started"

# ── Done ──────────────────────────────────────────────────────────────────────
HOST_IP=$(hostname -I | awk '{print $1}')
echo ""
success "Powder Roster is running!"
echo ""
echo -e "  ${GREEN}App:${NC}      http://${HOST_IP}"
echo -e "  ${GREEN}API docs:${NC} http://${HOST_IP}/api/docs"
echo -e "  ${GREEN}Login:${NC}    admin@example.com / changeme"
echo ""
echo -e "  ${YELLOW}Remember to change the admin password after first login!${NC}"
echo ""
echo -e "  To update later:  ${CYAN}bash $INSTALL_DIR/update.sh${NC}"
echo ""
