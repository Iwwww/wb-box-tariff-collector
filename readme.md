# Сборщик тарифов коробов Wildberries

## Содержание

- [Сборщик тарифов коробов Wildberries](#%D1%81%D0%B1%D0%BE%D1%80%D1%89%D0%B8%D0%BA-%D1%82%D0%B0%D1%80%D0%B8%D1%84%D0%BE%D0%B2-%D0%BA%D0%BE%D1%80%D0%BE%D0%B1%D0%BE%D0%B2-wildberries)
  * [Описание](#%D0%BE%D0%BF%D0%B8%D1%81%D0%B0%D0%BD%D0%B8%D0%B5)
  * [Подготовка к запуску](#%D0%BF%D0%BE%D0%B4%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D0%BA%D0%B0-%D0%BA-%D0%B7%D0%B0%D0%BF%D1%83%D1%81%D0%BA%D1%83)
  * [Команды](#%D0%BA%D0%BE%D0%BC%D0%B0%D0%BD%D0%B4%D1%8B)
    + [spreadsheets-manager](#spreadsheets-manager)
      - [Запуск утилиты](#%D0%B7%D0%B0%D0%BF%D1%83%D1%81%D0%BA-%D1%83%D1%82%D0%B8%D0%BB%D0%B8%D1%82%D1%8B)
      - [Usage](#usage)
      - [Запуск в Docker](#%D0%B7%D0%B0%D0%BF%D1%83%D1%81%D0%BA-%D0%B2-docker)
  * [Структура данных API "Тарифы коробов" для хранения в БД](#структура-данных-api-“тарифы-коробов”-для-хранения-в-бд)
  * [TODO](#todo%3A)


## Описание

Проект написан на основе шаблона.

Приложение выполняет две джобы по таймеру:

1. Каждый час получает данные по Wildberries API, сохраняет в базу данных и обновляет значения в Google Sheets. 
    Пошаговый механизм работы:
    1. Получение данных тарифов коробов через запрос к API Wildberries
    1. Тарифы сохраняются в последнюю строку таблици `wb_box_tariffs` 
    2. Из таблицы `spreadsheets_id` берутся ID таблиц Google Sheets
    3. Для каждой таблицы проверяется наличие в таблице листа с именем **stocks_coefs**, если его нет, то он будет создан
    4. Записываются новые данные в таблицы. Данные отсортированны по коэффициенту **boxDeliveryCoefExpr**

2. Каждые сутки в 03:30 добавляется новая строка в БД, таки образом данные в новом дне не будут перезаписываться.

Для взаимодействия с таблицей `spreadsheets_id` используется утилита командной строки [spreadsheets-manager](#spreadsheets-manager).

Настоены контейнеры для `postgres` и приложения на `nodejs`.  
Для взаимодействия с БД используется `knex.js`.  
В контейнере `app` используется `build` для приложения на `ts`, но можно использовать и `js`.

Все настройки можно найти в файлах:

- [compose](compose.yaml)
- [ dockerfile ]( dockerfile )
- [ package.json ]( package.json )
- [ tsconfig.json ]( tsconfig.json )
- [ src/config/env/env.ts ]( src/config/env/env.ts )
- [ src/config/knex/knexfile.ts ]( src/config/knex/knexfile.ts )
- [ src/config/gooogleSheetsExporter.ts ]( src/config/gooogleSheetsExporter.ts )
- [ src/config/wildberriesClient.ts ]( src/config/wildberriesClient.ts )

## Подготовка к запуску

Создайте файл переменных окружения `.env`

```bash
cp {example,}.env
```

В файле укажите ключ Wildberries API и путь к фйлу с данными Google Service Account в формате json:

```
WB_API_KEY=<ваш ключ>
GOOGLE_SERVICE_ACCOUNT_JSON_FILE=<ваш файл.json>
```

Для получения прав на измение содержимого в Google Sheets, необходимо пригласить сервисный аккаунт как  **Редактора**.

spreadsheet_id можно взять из ссылки на Google Таблицу. ID таблицы находится здесь:

`https://docs.google.com/spreadsheets/d/<ID-таблицы-здесь>/edit?gid=439448639#gid=439448639`

Пример: *https://docs.google.com/spreadsheets/d/**1rFXPRwilL6Jojxc4tOvIy7H5B9DS-HfWci3n1DlC8Uc**/edit?gid=439448639#gid=439448639*


## Команды

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

Утилита командной строки предназначена для управления Google Spreadsheet ID в базе данных и проверки прав доступа к ним.


#### Запуск утилиты

```bash
npm run spreadsheets-manager <command>
```

Для разработки используйте:

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

#### Запуск в Docker

Для запуска в докере используйте команду:
```bash
docker compose exec app npm run spreadsheets-manager <command>
```


## Структура данных API "Тарифы коробов" для хранения в БД

Данные, полученные от API хранятся в jsonb формате. Это позволяет не изменять структуру БД при изменении API. Jsonb позволяет эффективно хранить json и при необходимости создавать индексы для быстрого поиска по полям json.

## TODO:

- [ ] покрытие тестами (не успел)
