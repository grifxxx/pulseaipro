# PulseAiPro

Раз в день собирает новости и рыночные данные по фиксированному watchlist'у акций (США и России) и крипты,
прогоняет через OpenAI и публикует короткие «почему это заметно» карточки — с явной
пометкой, что это не инвестиционная рекомендация. Phase 2 (позже, отдельно) — Telegram-бот,
читающий ту же базу.

## 1. Получить 4 бесплатных ключа

### Supabase (база данных)
1. Зарегистрируйтесь на [supabase.com](https://supabase.com), создайте новый проект.
2. В SQL Editor выполните содержимое [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
   создаст таблицы `watchlist_assets`, `pipeline_runs`, `attention_notes` и политики RLS.
3. В Project Settings → API скопируйте `Project URL`, `anon public` ключ и `service_role` ключ.

### Finnhub (котировки и новости по акциям)
1. Зарегистрируйтесь на [finnhub.io/register](https://finnhub.io/register).
2. Скопируйте API key из личного кабинета (бесплатный тариф — 60 запросов/мин, этого хватает с запасом).

### CoinGecko Demo (крипта)
1. Зарегистрируйтесь на [coingecko.com](https://www.coingecko.com/en/api/pricing) и оформите бесплатный **Demo** план.
2. Скопируйте выданный API-ключ (используется в заголовке `x-cg-demo-api-key`).

### OpenAI (синтез сводок)
1. Создайте ключ на [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Пополните баланс на несколько долларов (pay-as-you-go) — при одном запуске в день расходы минимальны.

### CRON_SECRET
Просто придумайте случайную строку сами (например, `openssl rand -hex 32`) — она защищает
`/api/cron/run-pipeline` от прогона посторонними и от сжигания бесплатных лимитов API.

## 2. Настройка окружения

```bash
cp .env.local.example .env.local
```

Заполните все 7 переменных значениями из шага 1.

## 3. Запуск локально

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Пока пайплайн ни разу не запускался,
лента будет пустой — это ожидаемо.

## 4. Ручной прогон пайплайна (сбор данных → анализ → запись в БД)

С запущенным `npm run dev` в отдельном терминале:

```bash
curl -H "Authorization: Bearer <ваш CRON_SECRET>" http://localhost:3000/api/cron/run-pipeline
```

Проверьте:
- Ответ `{"ok":true,"assetsScanned":...,"notesCreated":...}`.
- В Supabase таблица `pipeline_runs` — новая строка со `status = 'success'`.
- В Supabase таблица `attention_notes` — новые строки.
- На `/` появились карточки с дисклеймером, источниками и sentiment-бейджем.
- Пробегитесь по паре сгенерированных `summary`/`why_notable` глазами — убедитесь, что там нет
  прямых формулировок «покупайте/продавайте» (модель проинструктирована их избегать, но стоит
  выборочно проверять).

## 5. Деплой на Vercel

1. Запушьте проект в свой git-репозиторий, импортируйте в [vercel.com/new](https://vercel.com/new).
2. В Project Settings → Environment Variables добавьте все 7 переменных из `.env.local`.
3. `vercel.json` уже содержит cron-конфиг (`0 13 * * *`, раз в день) — Vercel Hobby поддерживает
   расписание не чаще раза в сутки, дальше это ограничение снимается только на платном плане.
4. После первого деплоя Vercel сам добавляет заголовок `Authorization: Bearer <CRON_SECRET>` при
   вызове cron-роута — ничего дополнительно настраивать не нужно.

## Структура проекта

```
app/
  page.tsx                    — лента (главная)
  asset/[symbol]/page.tsx     — история по активу
  about/page.tsx              — методология и дисклеймер
  api/cron/run-pipeline/      — защищённый роут, запускает пайплайн
lib/
  datasources/                — клиенты Finnhub, CoinGecko, RSS
  llm/                        — промпт, JSON-схема, вызов OpenAI
  db/                         — Supabase-клиенты и запросы
  pipeline/run-pipeline.ts    — оркестрация всего цикла
data/watchlist.seed.ts        — стартовый список акций/монет
supabase/migrations/          — SQL-схема БД
```

Полный план и обоснование архитектурных решений — в `.claude/plans` (использовался при разработке).
