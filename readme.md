# Шаблон для выполнения тестового задания

## Описание
Шаблон подготовлен для того, чтобы попробовать сократить трудоемкость выполнения тестового задания.

В шаблоне настоены контейнеры для `postgres` и приложения на `nodejs`.  
Для взаимодействия с БД используется `knex.js`.  
В контейнере `app` используется `build` для приложения на `ts`, но можно использовать и `js`.

Шаблон не является обязательным!\
Можно использовать как есть или изменять на свой вкус.

Все настройки можно найти в файлах:
- compose.yaml
- dockerfile
- package.json
- tsconfig.json
- src/config/env/env.ts
- src/config/knex/knexfile.ts

## Команды:

Запуск базы данных:
```bash
docker compose up -d --build postgres
```

Для выполнения миграций и сидов не из контейнера:
```bash
npm run knex:dev migrate latest
```

```bash
npm run knex:dev seed run
```
Также можно использовать и остальные команды (`migrate make <name>`,`migrate up`, `migrate down` и т.д.)

Для запуска приложения в режиме разработки:
```bash
npm run dev
```

## Tariffs Box pipeline

1. Скопируйте `example.env` в `.env` и заполните:
   - Параметры подключения Postgres.
   - `WB_API_*` для внешнего API.
   - `RAW_STORAGE_DIR` — локальная директория для снапшотов.
   - `GOOGLE_*` — реквизиты сервис-аккаунта и ID таблицы.
2. Запустите `npm run dev` либо `npm run start` (после `npm run build`).
3. Приложение последовательно:
   - Выгружает тарифы из внешнего API.
   - Сохраняет raw JSON/текст в файловой системе и таблице `tariffs_box_raw`.
   - Нормализует данные и пишет их в `tariffs_box`.
   - Экспортирует результат в указанный Google Spreadsheet.

Запуск проверки самого приложения:
```bash
docker compose up -d --build app
```

Для финальной проверки рекомендую:
```bash
docker compose down --rmi local --volumes
docker compose up --build
```

PS: С наилучшими пожеланиями!
