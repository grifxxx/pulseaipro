# Перенос PulseAiPro с Vercel на Jino VPS

## Что за сервер

| | |
|---|---|
| Хост | `73edbea2dac1.vps.myjino.ru`, SSH на порту **49338** |
| IP | 81.177.6.125 |
| Ключ | `~/.ssh/jino_shared_ed25519` |
| Домен | pulsaipro.ru, регистратор Domenus, DNS уже на ns1-4.jino.ru |
| Каталог | `/opt/pulsaipro` (исходники в `src`, рабочая копия в `current`) |
| Секреты | `/etc/pulsaipro.env` |
| Служба | `systemctl status pulsaipro`, логи `journalctl -u pulsaipro -f` |
| Порт | 3100, слушает только 127.0.0.1, наружу через nginx |

Порты 80 и 443 снаружи открыты — той засады с перехватом веб-портов, что была на старом VPS
под Деклариум, здесь нет, проверено сокетом до всякой установки. Сейчас по IP отдаётся
парковочная страница Джино («Ошибка 404. Файл не найден»), то есть nginx работает, а нашего
сайта за ним ещё нет.

## Чем это отличается от Vercel

Vercel делал три вещи, которых на своём сервере нет по умолчанию. Все три закрыты файлами
в этой папке:

1. **Запуск.** В `next.config.ts` включён `output: "standalone"` — сборка кладёт в
   `.next/standalone` самодостаточный сервер со своими node_modules, его и запускает systemd.
2. **Оптимизация картинок.** На Vercel её делает платформа, на своём хосте нужен `sharp` —
   добавлен в зависимости. Без него `next/image` отдавал бы оригиналы обложек по 170 КБ
   вместо 9 КБ.
3. **Cron.** Блок `crons` в `vercel.json` понимает только Vercel. Те же четыре задания с теми
   же расписаниями лежат в `deploy/pulsaipro.cron`, ходят на `127.0.0.1:3100` с тем же
   заголовком `Authorization: Bearer $CRON_SECRET`. Указан `CRON_TZ=UTC`, как у Vercel, —
   иначе дайджест уедет на три часа.

## Порядок переноса

Сборка делается **на сервере**, а не на рабочей машине: `sharp` и SWC — платформенные
бинарники, и релиз, собранный под Windows, тащит `sharp-win32-x64`, который на Linux не
запускается. Репозиторий публичный, поэтому сервер клонирует его сам.

### 1. Секреты

Один раз, на сервере. За образец — `deploy/pulsaipro.env.example`:

    sudo nano /etc/pulsaipro.env
    sudo chown root:www-data /etc/pulsaipro.env
    sudo chmod 640 /etc/pulsaipro.env

Значения брать из Vercel → Settings → Environment Variables. `CRON_SECRET` сгенерировать
новый (`openssl rand -hex 32`) — старый остаётся известен Vercel.

### 2. Установка

    ssh -p 49338 -i ~/.ssh/jino_shared_ed25519 ПОЛЬЗОВАТЕЛЬ@73edbea2dac1.vps.myjino.ru
    sudo apt-get update -qq && sudo apt-get install -y -qq git
    git clone --depth 1 https://github.com/grifxxx/pulseaipro.git /tmp/pulsaipro
    sudo bash /tmp/pulsaipro/deploy/install.sh pulsaipro.ru ПОЧТА

Скрипт поставит Node 22, соберёт проект, поднимет службу на 3100, настроит nginx, положит
задания cron и попробует выпустить сертификат. Повторный запуск обновляет сайт до свежего
коммита master и ничего не ломает: `/etc/pulsaipro.env` не трогается, сертификат не
перевыпускается.

### 3. Проверка до переключения DNS

    curl -H "Host: pulsaipro.ru" http://81.177.6.125/

Должен прийти 200 и разметка главной. Пока приходит парковочная страница Джино — DNS не
трогать.

### 4. Переключение домена

Панель Jino → DNS для pulsaipro.ru. Запись **A** с текущей вercel-овской `66.33.60.67`
поменять на **81.177.6.125**, и такую же для `www`. TTL у Jino обычно 3600, так что
переключение размазано примерно на час.

### 5. После переключения

- Сертификат. Если certbot на шаге 2 не отработал (DNS ещё смотрел на Vercel), повторить:
  `sudo certbot --nginx -d pulsaipro.ru -d www.pulsaipro.ru`
- **В Vercel отключить cron** или удалить проект. Иначе два хоста будут дублировать
  генерацию: две статьи вместо одной и два дайджеста в канал за день.
- Проверить `/sitemap.xml` и `/feed.xml` — они строятся от `NEXT_PUBLIC_SITE_URL`, и если
  переменную не заполнить, там окажется localhost.
- Вебхук телеграм-бота переставлять не нужно: домен не меняется.

## Обновление сайта потом

    ssh -p 49338 -i ~/.ssh/jino_shared_ed25519 ПОЛЬЗОВАТЕЛЬ@73edbea2dac1.vps.myjino.ru \
      'sudo bash /opt/pulsaipro/src/deploy/install.sh pulsaipro.ru ПОЧТА'

## Чего я не смог сделать сам

Имя пользователя SSH на этом сервере мне неизвестно: под `root`, `ubuntu`, `debian`, `jino`,
`admin` и `user` ключ `jino_shared_ed25519` не пускает, а подбирать дальше я не стал. Имя
видно в панели Jino → ваш VPS → доступ по SSH. Без него ни выложить релиз, ни поменять
A-запись нельзя — и то и другое требует либо входа в панель, либо рабочего SSH.
