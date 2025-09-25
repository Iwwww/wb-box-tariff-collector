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
- src/config/gooogleSheetsExporter.ts
- src/config/wildberriesClient.ts

## Команды:

Установка зависимостей:
```bash
npm install
```

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

Запуск проверки самого приложения:

```bash
docker compose up -d --build app
```

Для финальной проверки рекомендую:

```bash
docker compose down --rmi local --volumes
docker compose up --build
```


### spreadsheets-manager

Утилита командной строки для управления Google Spreadsheet ID в базе данных и проверки прав доступа к ним.

#### Запуск утилиты:

```bash
npm run spreadsheets-manager <command>
```

Для разработки исаользуйте:

```bash
npm run spreadsheets-manager:dev <command>
```

Для работы с Google Sheets API убедитесь, что у вас настроен файл сервисного аккаунта (`GOOGLE_SERVICE_ACCOUNT_JSON_FILE`) в переменных окружения.

#### Usage

```
Утилита для управления spreadsheet_id в базе данных

Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  add|push <spreadsheet_ids...>             Добавить новый spreadsheet_id
  remove|delete <spreadsheet_id>            Удалить spreadsheet_id
  list|ls                                   Показать все spreadsheet_id
  exists <spreadsheet_id>                   Проверить существование spreadsheet_id
  count                                     Показать количество spreadsheet_id
  check-permissions|check <spreadsheet_id>  Проверить доступ и права на запись для указанного spreadsheet_id в Google Sheets
  *
  help [command]                            display help for command

```

