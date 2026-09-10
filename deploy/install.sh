#!/usr/bin/env bash
# Ставит и обновляет PulseAiPro на сервере. Запускать под root:
#
#   bash install.sh pulsaipro.ru вы@почта.ru
#
# Скрипт клонирует репозиторий, собирает проект НА СЕРВЕРЕ и поднимает службу.
#
# Собирать обязательно здесь, а не на рабочей машине: sharp и SWC — платформенные бинарники,
# и сборка, сделанная под Windows, тащит sharp-win32-x64, который на Linux не запустится.
#
# Повторный запуск безопасен: /etc/pulsaipro.env не трогается, сертификат не перевыпускается.
set -euo pipefail

DOMAIN="${1:?использование: install.sh <домен> <почта>}"
EMAIL="${2:?использование: install.sh <домен> <почта>}"
REPO=https://github.com/grifxxx/pulseaipro.git
ROOT=/opt/pulsaipro
SRC="$ROOT/src"
APP="$ROOT/current"
ENV_FILE=/etc/pulsaipro.env

echo "==> Зависимости"
command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git; }
command -v nginx >/dev/null || { apt-get update -qq && apt-get install -y -qq nginx; }
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "    ставлю Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "    node $(node -v), npm $(npm -v)"

if [ ! -f "$ENV_FILE" ]; then
  echo "==> $ENV_FILE не найден — положил шаблон."
  echo "    Заполните его и запустите скрипт заново."
  install -m 640 "$(dirname "${BASH_SOURCE[0]}")/pulsaipro.env.example" "$ENV_FILE"
  chown root:www-data "$ENV_FILE" 2>/dev/null || true
  exit 1
fi

echo "==> Исходники"
mkdir -p "$ROOT"
if [ -d "$SRC/.git" ]; then
  git -C "$SRC" fetch --depth 1 origin master
  git -C "$SRC" reset --hard origin/master
else
  rm -rf "$SRC"
  git clone --depth 1 "$REPO" "$SRC"
fi
echo "    $(git -C "$SRC" log -1 --format='%h %s')"

echo "==> Сборка"
cd "$SRC"
npm ci --no-audit --no-fund
# NEXT_PUBLIC_* переменные вшиваются в бандл на этапе сборки, поэтому секреты нужны уже здесь.
set -a; . "$ENV_FILE"; set +a
npm run build

echo "==> Раскладываю"
systemctl stop pulsaipro 2>/dev/null || true
rm -rf "$APP"
mkdir -p "$APP"
cp -a "$SRC/.next/standalone/." "$APP/"
mkdir -p "$APP/.next/static" "$APP/public" "$APP/.next/cache"
cp -a "$SRC/.next/static/." "$APP/.next/static/"
cp -a "$SRC/public/." "$APP/public/"
chown -R www-data:www-data "$APP"

echo "==> Служба"
install -m 644 "$SRC/deploy/pulsaipro.service" /etc/systemd/system/pulsaipro.service
systemctl daemon-reload
systemctl enable --now pulsaipro

echo "==> Жду ответа службы"
for i in $(seq 1 30); do
  if curl -fsS -m 5 -o /dev/null http://127.0.0.1:3100/; then echo "    отвечает"; break; fi
  [ "$i" = 30 ] && { echo "Не поднялась. Смотрите: journalctl -u pulsaipro -n 50 --no-pager"; exit 1; }
  sleep 2
done

echo "==> nginx"
sed "s/pulsaipro\.ru/$DOMAIN/g" "$SRC/deploy/nginx.conf" > "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Шаг выше переписал конфиг из шаблона, а значит стёр блок 443, который добавляет certbot.
# Поэтому TLS переустанавливается на каждом прогоне: без этого второй деплой оставлял сайт
# без HTTPS, и запросы к домену проваливались в чужой server-блок соседнего сайта.
command -v certbot >/dev/null || apt-get install -y -qq certbot python3-certbot-nginx
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "==> Возвращаю TLS в конфиг"
  certbot install --cert-name "$DOMAIN" --nginx --non-interactive 2>&1 | tail -2
else
  echo "==> Сертификат"
  # Выпустится только если A-запись домена уже смотрит на этот сервер.
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect \
    || echo "    !! Не вышло — скорее всего DNS ещё не переключён. Повторите после переключения."
fi

echo "==> Контроль: домен отвечает по HTTPS своим сайтом"
curl -sk -m 20 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" | grep -oE "<title>[^<]*" | head -1

echo
echo "Готово.  curl -I http://127.0.0.1:3100/   |   journalctl -u pulsaipro -f"
