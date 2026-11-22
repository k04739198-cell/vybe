#!/bin/bash
# One-click Ubuntu 22.04 / 24.04 coturn setup for Hetzner VPS (~€4/month)
# Run as root: sudo bash setup-turn.sh

set -e

echo "=== Installing coturn ==="
apt-get update && apt-get install -y coturn certbot

echo "=== Configuring coturn ==="
# Enable coturn daemon
sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

# Copy configuration
cp turnserver.conf /etc/turnserver.conf

# Open UFW firewall ports
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 5349/udp
ufw allow 49152:65535/udp

echo "=== Starting coturn service ==="
systemctl restart coturn
systemctl enable coturn

echo "=== coturn is running! ==="
systemctl status coturn --no-pager
