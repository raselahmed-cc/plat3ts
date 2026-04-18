#!/bin/bash
set -e

echo "=== Plat3s VPS Deployment Script ==="
echo ""

APP_DIR="/var/www/plat3s"
DOMAIN="plat3s.com"

# ---- 1. Install Node.js 20 via NVM ----
echo "[1/7] Installing Node.js 20..."
if ! command -v node &> /dev/null || [[ "$(node -v)" != v20* ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
    nvm alias default 20
fi
echo "Node: $(node -v)"

# ---- 2. Install PM2 ----
echo "[2/7] Installing PM2..."
npm install -g pm2

# ---- 3. Create app directory ----
echo "[3/7] Setting up app directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# ---- 4. Copy files (run from the extracted zip directory) ----
echo "[4/7] Copying app files..."
cp -r ./* $APP_DIR/
cp .env $APP_DIR/ 2>/dev/null || true
cp .nvmrc $APP_DIR/ 2>/dev/null || true

# ---- 5. Setup Nginx ----
echo "[5/7] Configuring Nginx..."
sudo apt update && sudo apt install -y nginx
sudo cp $APP_DIR/nginx.conf /etc/nginx/sites-available/plat3s
sudo ln -sf /etc/nginx/sites-available/plat3s /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ---- 6. SSL with Certbot ----
echo "[6/7] Setting up SSL..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL setup may need manual completion. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# ---- 7. Start with PM2 ----
echo "[7/7] Starting app with PM2..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
cd $APP_DIR
pm2 delete plat3s 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || echo "Run 'pm2 startup' manually to enable auto-start on boot"

echo ""
echo "=== Deployment Complete ==="
echo "App running at: https://$DOMAIN"
echo "PM2 status: pm2 status"
echo "PM2 logs:   pm2 logs plat3s"
