import knex from "#postgres/knex.js";
import { getWbTariffsData } from "#services/wildberriesClient/wildberriesClient.js";
import { WbBoxTariffsTable, WbBoxTariffsData, WbWarehouseTariff } from "#types/tariffStorage.js";

/** Статус операции выгрузки данных */
export enum Status {
    /** Не инициализирован */
    NOT_INITILIZED = 0,
    /** Ожидает выгрузки */
    PENDING = 1,
    /** Выгружено успешно */
    COMPLETED = 2,
    /** Выгрузка завершилась с ошибкой */
    FAILED = 3,
}

/** Вставляет новую строку в таблицу `wb_box_tariffs` */
export async function insertRow() {
    console.log("DB: Inserting new row.");
    return await knex<WbBoxTariffsTable>("wb_box_tariffs").insert({ data: null });
}

/**
 * Обновляет последнюю строку или создаёт новую строку в таблице `wb_box_tariffs`
 *
 * @param tariffs {WbBoxTariffsData} Тарифы коробов
 */
export async function upsertLastRow(tariffs: WbBoxTariffsData): Promise<void> {
    try {
        const update = await knex<WbBoxTariffsTable>("wb_box_tariffs")
            .update({
                data: tariffs,
                upload_status: Status.PENDING,
            })
            .where("id", "=", knex<WbBoxTariffsTable>("wb_box_tariffs").max("id"));

        if (update === 0) {
            console.log("DB: Can not find any rows to update.");
            insertRow();
            return upsertLastRow(tariffs);
        }

        console.log("Wildberries box tariffs updated successfully to DB.");
    } catch (error) {
        console.error("Error saving Wildberries box tariffs to DB:", error);
        throw error;
    }
}

/**
 * Обновляет статусы строк тарифов
 *
 * @param ids {number[]} Массив ID записей
 * @param status {Status} Новый статус записи
 * @returns Promise<void>
 */
export async function updateStatus(ids: number[], status: Status): Promise<void> {
    try {
        const amount = await knex<WbBoxTariffsTable>("wb_box_tariffs").update({ upload_status: status }).whereIn("id", ids);

        console.error("Updated Wildberries box tariffs status amount:", amount);
    } catch (error) {
        console.error("Error updated Wildberries box tariffs status:", error);
        throw error;
    }
}

/**
 * Получает последние данные тарифов с заданным статусом с ID записи в таблице
 *
 * @param status {Status} Статус для фильтрации записи
 * @returns Promise<{ id: number; data: WbBoxTariffsData | null} | undefined> ID записи и данных из поля `data`
 */
export async function getLastDataIfStatus(status: Status): Promise<{ id: number; data: WbBoxTariffsData | null } | undefined> {
    try {
        const rowResult: { id: number; data: WbBoxTariffsData | null } | undefined = await knex<WbBoxTariffsTable>("wb_box_tariffs")
            .select("data", "id")
            .where("id", "=", knex<WbBoxTariffsTable>("wb_box_tariffs").max("id"))
            .andWhere("upload_status", status)
            .first();

        console.log("Retrieved last Wildberries box tariffs data for status:", Status[status]);

        const result = rowResult?.id ? { id: rowResult.id, data: rowResult.data } : undefined;
        return result;
    } catch (error) {
        console.error(`Error retrieving last Wildberries box tariffs data with status "${Status[status].toString()}": ${error}`);
        throw error;
    }
}
