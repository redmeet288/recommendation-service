# recommendation-service

Микросервис рекомендаций: сортирует задачи (`subjectType=JOB`) по пересечению стека пользователя (`profile.stack`) и технологий из ответов сервиса заказов.

Важно: сервис **не вырезает поля** из JSON задач/исполнителей. На фронт отдаётся исходный объект (только отсортированный).

## Требования

- Node.js 20+
- PostgreSQL (Prisma использует `DATABASE_URL`)

## Установка и запуск

```bash
npm install
cp .env.example .env
# задать DATABASE_URL
npx prisma generate
npm run db:migrate
npm run dev
```

Сборка и запуск из `dist`:

```bash
npm run build
npm start
```

По умолчанию порт **3002** (переменная `PORT`).

## Переменные окружения

См. `.env.example`.

| Переменная | Назначение |
|------------|------------|
| `PORT` | Порт HTTP (например `3002`) |
| `DATABASE_URL` | PostgreSQL для Prisma |
| `JOBS_SERVICE_BASE_URL` | Базовый URL сервиса заказов (jobs-service/BFF) |
| `PROFILE_SERVICE_BASE_URL` | Базовый URL profile-service |

## Аутентификация (как у вас в gateway)

На все запросы к recommendation-service нужны заголовки:

- `X-User-Id`
- `X-Roles`

Они прокидываются в profile-service при `GET {PROFILE_SERVICE_BASE_URL}/profiles/me`.

## API

- `GET /health` — `{ "status": "ok" }`
- `GET /recommendations/me?subjectType=JOB`
  - headers: `X-User-Id`, `X-Roles`
  - response: `{ "items": [...] }`, где `items` — исходные JSON объекты из jobs-service, отсортированные по score
  - если профиль не найден: `{ "error": "не удалось найти профиль" }`
  - если задачи не найдены: `{ "error": "не удалось найти задачи" }`
- `GET /recommendations/me/cursor?subjectType=JOB`
  - headers: `X-User-Id`, `X-Roles`, `X-Cursor` (опционально; курсор для постраничной выдачи)
  - response: `{ "items": [...], "nextCursor": "...", "hasMore": true/false }`, где страница фиксирована: `pageSize=1`
  - если профиль не найден: `{ "error": "не удалось найти профиль" }`
  - если задачи не найдены: `{ "error": "не удалось найти задачи" }`

## Структура

- `src/app.ts` — вход, wiring зависимостей
- `src/routes.ts`, `src/authMiddleware.ts`
- `src/controllers/`
- `src/application/`
- `src/domain/`
- `src/infrastructure/` — Prisma + HTTP-клиенты к внешним сервисам
