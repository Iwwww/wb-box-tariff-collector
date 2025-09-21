import { API_WB_BASE_URL, API_WB_TARIFFS_PATH } from "#config/wildberriesClient.js";
import env from "#config/env/env.js";
import { fetchJsonData } from "#utils/http.js";
import { WbBoxTariffsData, WbBoxTariffsResponse } from "#types/tariffStorage.js";
import wbBoxTariffsResponse from "./mock/wbBoxTariffsResponse.js";

/**
 * Запрашивает тарифов коробов
 *
 * @returns {Promise<WbBoxTariffsResponse>}
 */
async function fetchWbTariffs(): Promise<WbBoxTariffsResponse> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;

    const url = `${API_WB_BASE_URL}/${API_WB_TARIFFS_PATH}?date=${currentDate}`;
    const init: RequestInit = {
        method: "GET",
        headers: new Headers({
            "Authorization": `Bearer ${env.WB_API_KEY}`,
            "Content-Type": "application/json",
        }),
    };
    // const jsonResponse: WbBoxTariffsResponse = await fetchJsonData<WbBoxTariffsResponse>(url, init);

    // mock data
    const jsonResponse: WbBoxTariffsResponse = wbBoxTariffsResponse;

    return jsonResponse;
}

/** @returns {Promise<WbBoxTariffsData>} Возвращает данные тарифов */
export async function getWbTariffsData(): Promise<WbBoxTariffsData> {
    const jsonResponse = await fetchWbTariffs();
    const data: WbBoxTariffsData = jsonResponse.response.data;
    return data;
}
