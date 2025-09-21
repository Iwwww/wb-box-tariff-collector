import knex from "#postgres/knex.js";
import { getWbTariffsData } from "#services/wildberriesClient/wildberriesClient.js";
import { WbBoxTariffsTable, WbBoxTariffsData } from "#types/tariffStorage.js";
// import { wbBoxTariffsResponseMock } from "./mock/wbBoxTariffsResponse.js";

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

export async function updateWbTariffs() {
    const tariffs = await getWbTariffsData();
    await upsertLastRow(tariffs);
    return true;
}

/** Вставляет новую строку в таблицу `wb_box_tariffs` */
export async function insertRow() {
    console.log("DB: Inserting new row.");
    return await knex<WbBoxTariffsTable>("wb_box_tariffs").insert({ data: {} });
}

/**
 * Обновляет последнюю строку или создаёт новую строку в таблице `wb_box_tariffs`
 *
 * @param tariffs {WbBoxTariffsData} Тарифы коробов
 */
async function upsertLastRow(tariffs: WbBoxTariffsData): Promise<void> {
    try {
        const update = await knex<WbBoxTariffsTable>("wb_box_tariffs")
            .update({
                data: tariffs,
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
