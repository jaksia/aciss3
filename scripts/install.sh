#!/bin/sh
set -e

# Visual formatting helper
info() { printf "\033[32m[+] %s\033[0m\n" "$1"; }
warn() { printf "\033[33m[!] %s\033[0m\n" "$1"; }
error() { printf "\033[31m[-] %s\033[0m\n" "$1"; exit 1; }
italic() { printf "\033[3m%s\033[0m\n" "$1"; }

# Minimum version constraints
MIN_DOCKER_VER="20.10.0"
MIN_COMPOSE_VER="2.0.0"

# Compare semantic versioning: returns true if $1 >= $2
version_gte() {
  [ "$1" = "$2" ] && return 0
  older=$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)
  [ "$older" = "$2" ]
}

info "Checking system requirements..."

# 1. Check Docker installation and version
if ! command -v docker >/dev/null 2>&1; then
  error "Docker is not installed. Please install Docker first."
fi

DOCKER_VER=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
if [ -z "$DOCKER_VER" ] || ! version_gte "$DOCKER_VER" "$MIN_DOCKER_VER"; then
  error "Docker version $MIN_DOCKER_VER or higher is required. Found: ${DOCKER_VER:-unknown}"
fi

# 2. Check Docker Compose (v2 plugin format) installation and version
if ! docker compose version >/dev/null 2>&1; then
  error "Docker Compose v2 plugin ('docker compose') is not installed."
fi

COMPOSE_VER=$(docker compose version --short 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
if [ -z "$COMPOSE_VER" ] || ! version_gte "$COMPOSE_VER" "$MIN_COMPOSE_VER"; then
  error "Docker Compose version $MIN_COMPOSE_VER or higher is required. Found: ${COMPOSE_VER:-unknown}"
fi

info "Docker ($DOCKER_VER) and Docker Compose ($COMPOSE_VER) checks passed."

# 3. Check port 80 accessibility without root
DEFAULT_PORT=8000
if command -v nc >/dev/null 2>&1; then
  if ! nc -z -l 80 >/dev/null 2>&1; then
    # Test if non-root user can bind to 80 (or if 80 is free)
    DEFAULT_PORT=80
  fi
fi

if [ "$DEFAULT_PORT" -eq 80 ]; then
  info "Port 80 appears available and accessible."
else
  warn "Port 80 is reserved or unavailable without root. Defaulting to port 8000."
fi

# Prompt user for port confirmation/override (reading from /dev/tty for piping support)
printf "Enter port to use for ACISS3 [%s]: " "$DEFAULT_PORT"
if [ -t 0 ]; then
  read SELECTED_PORT
else
  read SELECTED_PORT < /dev/tty 2>/dev/null || SELECTED_PORT=""
fi

PORT="${SELECTED_PORT:-$DEFAULT_PORT}"
info "Selected port: $PORT"

# 4. Create required directories
info "Creating directory structure..."
mkdir -p custom_sounds

# 5. Download compose.yml directly from GitHub
info "Downloading compose.yml..."
COMPOSE_URL="https://raw.githubusercontent.com/jaksia/aciss3/master/scripts/data/compose.yml"

if command -v curl >/dev/null 2>&1; then
  curl -sSL "$COMPOSE_URL" -o compose.yml || error "Failed to download compose.yml using curl."
elif command -v wget >/dev/null 2>&1; then
  wget -qO compose.yml "$COMPOSE_URL" || error "Failed to download compose.yml using wget."
else
  error "Neither curl nor wget is available on this system."
fi

if [ ! -s compose.yml ]; then
  error "Downloaded compose.yml is empty or missing."
fi

# Substitute port placeholder XXXXX with chosen port
sed -i.bak "s/XXXXX/$PORT/g" compose.yml && rm -f compose.yml.bak

# 6. Download nginx.conf
info "Downloading nginx.conf..."
NGINX_URL="https://raw.githubusercontent.com/jaksia/aciss3/master/scripts/data/nginx.conf"

if command -v curl >/dev/null 2>&1; then
  curl -sSL "$NGINX_URL" -o nginx.conf || error "Failed to download nginx.conf using curl."
elif command -v wget >/dev/null 2>&1; then
  wget -qO nginx.conf "$NGINX_URL" || error "Failed to download nginx.conf using wget."
fi

if [ ! -s nginx.conf ]; then
  error "Downloaded nginx.conf is empty or missing."
fi

# Detect host IPs
DETECTED_IPS=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' || hostname -I 2>/dev/null || echo "localhost")

echo ""
info "--------------------------------------------------------"
info "  ACISS3 Installation Complete!"
info "--------------------------------------------------------"
echo ""
echo "To START aciss3:"
echo "  docker compose up -d"
echo ""
echo "To UPDATE (pull latest images & restart):"
echo "  docker compose pull && docker compose up -d"
echo ""
italic "These commands should be run in the directory where this script was executed."
echo ""
echo "Access URLs:"
for IP in $DETECTED_IPS; do
  echo "  - http://${IP}:${PORT}/"
done
echo ""