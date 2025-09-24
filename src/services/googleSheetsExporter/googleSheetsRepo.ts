// TODO:
// утилита для добавления добавления/удаления/просмотра таблиц

import { SHEET_NAME } from "#config/gooogleSheetsExporter.js";
import { SheetsCtx } from "./googleSheetsClient.js";

/**
 * Проверка подключения к Google Sheets API
 *
 * @param ctx {SheetsCtx} Контекст
 * @param spreadsheetId {string} ID таблицы
 */
export async function ping(ctx: SheetsCtx, spreadsheetId: string): Promise<boolean> {
    try {
        const { sheets } = ctx;

        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
            fields: "properties.title",
        });

        console.log(`Google Sheets API. ID таблицы: ${spreadsheetId}. Имя таблицы: "${response.data.properties?.title}". Подключение успешно`);
        return true;
    } catch (error: any) {
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}, ошибка подключения: ${error.message}`);
        return false;
    }
}

/**
 * Проверка прав на запись таблицы
 *
 * @param ctx {SheetsCtx} Контекст
 * @param spreadsheetId {string} ID таблицы
 */
export async function checkWritePermissions(ctx: SheetsCtx, spreadsheetId: string): Promise<boolean> {
    try {
        const { sheets } = ctx;

        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: "Z1000",
            valueInputOption: "RAW",
            requestBody: {
                values: [["Test write permissions"]],
            },
        });

        await sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: "Z1000",
        });

        console.log(`Google Sheets API. ID таблицы: ${spreadsheetId}. Права на запись: ОК`);

        return true;
    } catch (error: any) {
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}. Ошибка проверки прав: ${error.message}`);
        return false;
    }
}

/**
 * Создаёт новый лист в таблице
 *
 * @param ctx {SheetsCtx} Контекст
 * @param spreadsheetId {string} ID таблицы
 * @param [sheetName=SHEET_NAME] Лист таблицы. Default is `SHEET_NAME`
 */
async function createSheet(ctx: SheetsCtx, spreadsheetId: string, sheetName: string = SHEET_NAME): Promise<void> {
    try {
        const { sheets } = ctx;
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetName,
                            },
                        },
                    },
                ],
            },
        });

        console.log(`Google Sheets API. ID таблицы: ${spreadsheetId}. Создан новый лист ${sheetName}`);
    } catch (error: any) {
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}. Ошибка создания листа ${sheetName}: ${error.message}`);
        throw error;
    }
}

/**
 * Полностью очищает лист таблицы или создаёт новый лист, если такой лист не существует
 *
 * @param ctx {SheetsCtx} Контекст
 * @param spreadsheetId {string} ID таблицы
 * @param [sheetName=SHEET_NAME] Лист таблицы. Default is `SHEET_NAME`
 */
export async function claerOrCreateSheet(ctx: SheetsCtx, spreadsheetId: string, sheetName: string = SHEET_NAME) {
    try {
        const { sheets } = ctx;
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId });
        const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties.title === sheetName);

        if (!sheet) {
            console.log(`Google Sheets API. ID таблицы: ${spreadsheetId}. Лист ${sheetName} не найден, создаём новый лист ${sheetName}`);
            await createSheet(ctx, spreadsheetId, sheetName);
            return;
        }

        await sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A:Z`,
        });

        console.log(`Google Sheets API. ID таблицы: ${spreadsheetId}. Лист ${sheetName} очищен`);
    } catch (error: any) {
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}. Ошибка очстки листа ${sheetName}: ${error.message}`);
        throw error;
    }
}

/**
 * Записывает данные в лист таблицы
 *
 * @param ctx {SheetsCtx} Контекст
 * @param spreadsheetId {string} ID таблицы
 * @param data {string[][]}
 * @param [sheetName=SHEET_NAME] Имя листа. Default is `SHEET_NAME`
 * @returns Promise<void>
 */
export async function writeDataToSheet(ctx: SheetsCtx, spreadsheetId: string, data: string[][], sheetName: string = SHEET_NAME): Promise<void> {
    try {
        const { sheets } = ctx;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: "RAW",
            requestBody: {
                values: data,
            },
        });
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}. Данные записаны в лист ${sheetName} успешно`);
    } catch (error: any) {
        console.error(`Google Sheets API. ID таблицы: ${spreadsheetId}. Не удалось записать данные в лист ${sheetName}: ${error.message}`);
        throw error;
    }
}
