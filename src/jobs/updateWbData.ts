/** Задача: получить тарифы WB, сохранить в БД и выгрузить в Google Sheets. */

import { parentPort } from "node:worker_threads";
import env from "#config/env/env.js";
import knexConfig from "#config/knex/knexfile.js";
import Knex from "knex";
import { makeSheetsCtx } from "#services/googleSheetsExporter/googleSheetsClient.js";
import { claerOrCreateSheet, writeDataToSheet } from "#services/googleSheetsExporter/googleSheetsRepo.js";
import { getLastDataIfStatus, Status, updateStatus, upsertLastRow } from "#services/tariffStorage/tariffStorage.js";
import { getWbTariffsData } from "#services/wildberriesClient/wildberriesClient.js";
import { WbBoxTariffsData, WbWarehouseTariff } from "#types/tariffStorage.js";

function getMetaData(): string[] {
    const date = new Date().toString();
    return ["Дата обновления:", date];
}

function getHeaderRow(warehouseList: WbWarehouseTariff[]): string[] {
    if (!Array.isArray(warehouseList) || warehouseList.length === 0) return [];
    return Object.keys(warehouseList[0]);
}

function sortByCoefAscending(warehouseList: WbWarehouseTariff[], coef: keyof WbWarehouseTariff = "boxStorageCoefExpr"): void {
    warehouseList.sort((a, b) => {
        const av = a[coef];
        const bv = b[coef];
        if (av === "-" && bv === "-") return 0;
        if (av === "-") return -1;
        if (bv === "-") return 1;
        const valA = Number.parseFloat(String(av));
        const valB = Number.parseFloat(String(bv));
        if (Number.isNaN(valA) && Number.isNaN(valB)) return 0;
        if (Number.isNaN(valA)) return 1;
        if (Number.isNaN(valB)) return -1;
        return valA - valB;
    });
}

function getAllDataRows(warehouseList: WbWarehouseTariff[], header: string[]): string[][] {
    return warehouseList.map((w) => header.map((prop) => String(w[prop as keyof WbWarehouseTariff] ?? "")));
}

async function run(): Promise<void> {
    console.log("[job:update-wb-data] запустился в", new Date().toString());

    const knex = Knex(knexConfig);

    try {
        const spreadsheetIds = await knex.select("spreadsheet_id").from<{ spreadsheet_id: string }>("spreadsheets").pluck("spreadsheet_id");

        const ctx = await makeSheetsCtx(env.GOOGLE_SERVICE_ACCOUNT_JSON_FILE);

        console.log("[job:update-wb-data] загружаем тарифы WB...");
        const tariffs = await getWbTariffsData();
        await upsertLastRow(tariffs);
        console.log("[job:update-wb-data] тарифы WB загружены и сохранены");

        const rowData = await getLastDataIfStatus(Status.PENDING);
        if (!rowData) {
            console.log("[job:update-wb-data] нет не обработанных данных, завершаем задачю...");
            return;
        }

        const data = rowData.data as WbBoxTariffsData;
        const dataId = rowData.id;
        console.log(`[job:update-wb-data] обработка dataId=${dataId}`);

        const metaData = getMetaData();
        const header = getHeaderRow(data.warehouseList);

        sortByCoefAscending(data.warehouseList, "boxDeliveryCoefExpr");

        const allDataRows = header.length ? getAllDataRows(data.warehouseList, header) : [];

        if (spreadsheetIds.length > 0) {
            const updatePromises = spreadsheetIds.map(async (id) => {
                try {
                    await claerOrCreateSheet(ctx, id);
                    await writeDataToSheet(ctx, id, [metaData, header, ...allDataRows]);
                } catch (error: any) {
                    console.error(`[job:update-wb-data] Ошибка при обработке таблицы ${id}:`, error.message);
                }
            });
            await Promise.allSettled(updatePromises);
        } else {
            console.warn("[job:update-wb-data] нет id таблиц в БД");
        }

        await updateStatus([dataId], Status.COMPLETED);
        console.log(`[job:update-wb-data] завершился успешно в ${new Date().toString()}; dataId=${dataId}`);
    } finally {
        await knex.destroy();
    }
}

run()
    .then(() => {
        if (parentPort) parentPort.postMessage("done");
    })
    .catch((err) => {
        console.error("[job:update-wb-data] failed:", err?.message ?? err);
        if (err?.stack) console.error(err.stack);
        if (parentPort) parentPort.postMessage(err);
        else process.exit(1);
    });
