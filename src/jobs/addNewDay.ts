/** Задача: Добавлять пустую строку в БД. */

import { parentPort } from "node:worker_threads";
import knexConfig from "#config/knex/knexfile.js";
import Knex from "knex";
import { insertRow } from "#services/tariffStorage/tariffStorage.js";

async function run(): Promise<void> {
    console.log("[job:add-new-day] запустился в", new Date().toString());

    const knex = Knex(knexConfig);

    try {
        await insertRow();
        console.log(`[job:add-new-day] завершился успешно в ${new Date().toString()}`);
    } finally {
        await knex.destroy();
    }
}

run()
    .then(() => {
        if (parentPort) parentPort.postMessage("done");
    })
    .catch((err) => {
        console.error("[job:add-new-day] failed:", err?.message ?? err);
        if (err?.stack) console.error(err.stack);
        if (parentPort) parentPort.postMessage(err);
        else process.exit(1);
    });
