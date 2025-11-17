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
    - `WB_API_*` для внешнего API (`WB_API_URL`, `WB_API_PING_ENDPOINT`, `WB_API_ENDPOINT`, `WB_API_TOKEN`, `WB_API_TIMEOUT_MS`).
    - `RAW_STORAGE_DIR`, `RAW_STORAGE_RETENTION_DAYS` — директория и период хранения файлов.
    - `RAW_DB_RETENTION_DAYS`, `PIPELINE_REFRESH_INTERVAL_MINUTES`, `RETENTION_CLEANUP_INTERVAL_HOURS`.
    - `GOOGLE_*` — реквизиты сервис-аккаунта и ID таблицы.
2. Запустите `npm run dev` либо `npm run start` (после `npm run build`).
3. Приложение последовательно:
    - Выполняет `ping` к `https://common-api.wildberries.ru/ping` (или указанному endpoint) перед основной выгрузкой.
    - Выгружает тарифы из внешнего API.
    - Сохраняет raw JSON/текст в файловой системе и таблице `tariffs_box_raw`.
    - Нормализует данные и пишет их в `tariffs_box`.
    - Экспортирует результат в указанный Google Spreadsheet.
    - Возвращает JSON со структурой `response.data.dtNextBox/dtTillMax/warehouseList`, аналогичной ответу Wildberries.
4. Планировщики:
    - Перезапуск конвейера каждые 60 минут (значение настраивается).
    - Ежедневная чистка `storage/raw` и `tariffs_box_raw` старше 7 дней.
    - Для таблицы `tariffs_box` сохраняется только последний `raw_id` за вчерашний день, остальные строки удаляются вместе со всеми более старыми.

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
