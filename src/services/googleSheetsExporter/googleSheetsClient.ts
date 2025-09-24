import { google, sheets_v4 } from "googleapis";
import { resolve } from "path";
import { readFileSync } from "fs";

export type SheetsCtx = {
    sheets: sheets_v4.Sheets;
};

/**
 * Создаёт контекст для Google Sheets API
 *
 * @param keyFile {string} Файл с данными сервисного аккаунта
 * @returns Promise<SheetsCtx> Возвращает контекст для работы с API
 */
export async function makeSheetsCtx(keyFile: string): Promise<SheetsCtx> {
    const raw = readFileSync(resolve(keyFile), "utf8");
    const { client_email, private_key } = JSON.parse(raw);

    const auth = new google.auth.JWT({
        email: client_email,
        key: private_key,
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const ctx: SheetsCtx = { sheets: google.sheets({ version: "v4", auth }) };
    return ctx;
}
