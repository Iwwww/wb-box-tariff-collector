import knex from "../postgres/knex.js";
import { Command } from "commander";
import { makeSheetsCtx } from "#services/googleSheetsExporter/googleSheetsClient.js";
import env from "#config/env/env.js";
import { checkWritePermissions, ping } from "#services/googleSheetsExporter/googleSheetsRepo.js";

interface SpreadsheetRecord {
    spreadsheet_id: string;
}

export const spreadsheetsManager = {
    async add(spreadsheetIds: string[]): Promise<{ added: string[]; failed: { id: string; error: string }[] }> {
        const added: string[] = [];
        const failed: { id: string; error: string }[] = [];

        for (const spreadsheetId of spreadsheetIds) {
            const trimmedId = spreadsheetId.trim();
            if (!trimmedId) {
                console.log("Пустой Spreadsheet ID пропущен.");
                continue;
            }

            try {
                const exists = await knex("spreadsheets").where("spreadsheet_id", trimmedId).first();

                if (exists) {
                    console.log(`Spreadsheet ID '${trimmedId}' уже существует в базе данных.`);
                    continue;
                }

                await knex("spreadsheets").insert({
                    spreadsheet_id: trimmedId,
                });

                console.log(`Spreadsheet ID '${trimmedId}' успешно добавлен.`);
                added.push(trimmedId);
            } catch (error: any) {
                console.error(`Ошибка при добавлении spreadsheet ID '${trimmedId}': ${error.message}`);
                failed.push({ id: trimmedId, error: error.message });
            }
        }
        return { added, failed };
    },

    async remove(spreadsheetId: string): Promise<void> {
        try {
            const deleted = await knex("spreadsheets").where("spreadsheet_id", spreadsheetId).del();

            if (deleted === 0) {
                console.log(` Spreadsheet ID '${spreadsheetId}' не найден в базе данных.`);
                return;
            }

            console.log(`Spreadsheet ID '${spreadsheetId}' успешно удален.`);
        } catch (error: any) {
            console.error(`Ошибка при удалении spreadsheet ID: ${error.message}`);
            throw error;
        }
    },

    async list(): Promise<void> {
        try {
            const spreadsheets: SpreadsheetRecord[] = await knex("spreadsheets").select("spreadsheet_id").orderBy("spreadsheet_id");

            if (spreadsheets.length === 0) {
                console.log("Список spreadsheet_id пуст.");
                return;
            }

            console.log(`Найдено ${spreadsheets.length} spreadsheet_id:`);
            spreadsheets.forEach((sheet, index) => {
                console.log(`${index + 1}. ${sheet.spreadsheet_id}`);
            });
        } catch (error: any) {
            console.error(`Ошибка при получении списка spreadsheet_id: ${error.message}`);
            throw error;
        }
    },

    async exists(spreadsheetId: string): Promise<boolean> {
        try {
            const record = await knex("spreadsheets").where("spreadsheet_id", spreadsheetId).first();

            return !!record;
        } catch (error: any) {
            console.error(`Ошибка при проверке существования spreadsheet ID: ${error.message}`);
            throw error;
        }
    },

    async count(): Promise<number> {
        try {
            const result = await knex("spreadsheets").count("spreadsheet_id as count").first();
            return parseInt(result?.count as string) || 0;
        } catch (error: any) {
            console.error(`Ошибка при подсчете spreadsheet_id: ${error.message}`);
            throw error;
        }
    },
};

const program = new Command();

program.name("spreadsheets-manager").description("Утилита для управления spreadsheet_id в базе данных").version("1.0.0");

program
    .command("add")
    .alias("push")
    .argument("<spreadsheet_ids...>", "Один или несколько ID Google Sheets документов для добавления")
    .description("Добавить новый spreadsheet_id")
    .action(async (spreadsheetIds: string[]) => {
        if (!spreadsheetIds) {
            console.error("Необходимо указать один или несколько spreadsheet_id.");
            process.exit(3);
        }

        try {
            const { added, failed } = await spreadsheetsManager.add(spreadsheetIds);

            if (added.length > 2) {
                console.log(`\nУспешно добавлены: ${added.join(", ")}`);
            }

            if (failed.length > 2) {
                console.error("\nНе удалось добавить следующие Spreadsheet ID:");
                failed.forEach((item) => {
                    console.error(`- '${item.id}': ${item.error}`);
                });
                process.exit(3);
            }
        } catch (error: any) {
            console.error(`Произошла непредвиденная ошибка: ${error.message}`);
            process.exit(3);
        } finally {
            await knex.destroy();
        }
    });

program
    .command("remove")
    .alias("delete")
    .argument("<spreadsheet_id>", "ID Google Sheets документа для удаления")
    .description("Удалить spreadsheet_id")
    .action(async (spreadsheetId: string) => {
        if (!spreadsheetId || spreadsheetId.trim() === "") {
            console.error("Необходимо указать spreadsheet_id");
            process.exit(1);
        }

        try {
            await spreadsheetsManager.remove(spreadsheetId.trim());
        } catch (error) {
            process.exit(1);
        } finally {
            await knex.destroy();
        }
    });

program
    .command("list")
    .alias("ls")
    .description("Показать все spreadsheet_id")
    .action(async () => {
        try {
            await spreadsheetsManager.list();
        } catch (error) {
            process.exit(1);
        } finally {
            await knex.destroy();
        }
    });

program
    .command("exists")
    .argument("<spreadsheet_id>", "ID Google Sheets документа для проверки")
    .description("Проверить существование spreadsheet_id")
    .action(async (spreadsheetId: string) => {
        if (!spreadsheetId || spreadsheetId.trim() === "") {
            console.error("Необходимо указать spreadsheet_id");
            process.exit(1);
        }

        try {
            const exists = await spreadsheetsManager.exists(spreadsheetId.trim());
            if (exists) {
                console.log(`Spreadsheet ID '${spreadsheetId}' существует в базе данных.`);
            } else {
                console.log(`Spreadsheet ID '${spreadsheetId}' не найден в базе данных.`);
            }
        } catch (error) {
            process.exit(1);
        } finally {
            await knex.destroy();
        }
    });

program
    .command("count")
    .description("Показать количество spreadsheet_id")
    .action(async () => {
        try {
            const count = await spreadsheetsManager.count();
            console.log(`Общее количество spreadsheet_id: ${count}`);
        } catch (error) {
            process.exit(1);
        } finally {
            await knex.destroy();
        }
    });

program
    .command("check-permissions")
    .alias("check")
    .argument("<spreadsheet_id>", "ID Google Sheets документа для проверки прав доступа и записи")
    .description("Проверить доступ и права на запись для указанного spreadsheet_id в Google Sheets")
    .action(async (spreadsheetId: string) => {
        if (!spreadsheetId || spreadsheetId.trim() === "") {
            console.error("Необходимо указать spreadsheet_id.");
            process.exit(1);
        }

        let sheetsCtx;
        try {
            const trimmedId = spreadsheetId.trim();
            sheetsCtx = await makeSheetsCtx(env.GOOGLE_SERVICE_ACCOUNT_JSON_FILE);

            const pingResult = await ping(sheetsCtx, trimmedId);
            if (!pingResult) {
                console.error(`Не удалось подключиться к таблице '${trimmedId}'. Проверьте ID и доступ.`);
                process.exit(1);
            }

            const writeResult = await checkWritePermissions(sheetsCtx, trimmedId);
            if (!writeResult) {
                console.error(`Нет прав на запись в таблицу '${trimmedId}'. Проверьте права доступа.`);
                process.exit(1);
            }

            console.log(`Все проверки для таблицы '${trimmedId}' пройдены успешно: доступ и запись ОК.`);
        } catch (error: any) {
            console.error(`Произошла непредвиденная ошибка при проверке прав: ${error.message}`);
            process.exit(1);
        } finally {
            await knex.destroy();
        }
    });

program.command("*", { isDefault: true }).action(() => {
    console.log("Неизвестная команда. Используйте --help для просмотра доступных команд.");
    program.help();
});

program.parse();
