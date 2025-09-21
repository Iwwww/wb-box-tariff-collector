/**
 * Получает JSON-данные по указанному URL
 *
 * @template T Ожидаемый тип JSON-данных
 * @param {string} url URL-адрес для получения данных.
 * @param {RequestInit} [init] Параметры конфигурации для запроса fetch, такие как метод, заголовки и т.д.
 * @returns {Promise<T>} Промис, который разрешается с полученными JSON-данными, разобранными как тип T.
 * @throws {Error} Выбрасывает ошибку, если запрос не удался, или не удалось выполнить парсинг JSON
 */
export async function fetchJsonData<T>(url: string, init?: RequestInit): Promise<T> {
    try {
        const response = await fetch(url, init);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, \nresponse: ${JSON.stringify(await response.json())}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Failed to fetch JSON data");
        }

        const result = response.json() as Promise<T>;
        return result;
    } catch (error: any) {
        console.log(error.message);
        throw error;
    }
}
