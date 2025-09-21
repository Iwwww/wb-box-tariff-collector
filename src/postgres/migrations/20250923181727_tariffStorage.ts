import { Status } from "#services/tariffStorage/tariffStorage.js";
import { Knex } from "knex";

/** @returns {Promise<void>} */
export async function up(knex: Knex): Promise<void> {
    const uploadStatusValues = Object.values(Status).filter((value) => typeof value === "number");

    await knex.schema.createTable("wb_box_tariffs", (table) => {
        table.increments("id").primary();
        // Храним данные в jsonb формате, поскольку это изолирует
        // базу данных от структуры json, которую возвращает API
        table.jsonb("data");
        table
            .enu("upload_status", uploadStatusValues, {
                enumName: "upload_status_type",
                useNative: true,
            })
            .defaultTo(Status.NOT_INITILIZED)
            .notNullable();
        table.text("error");
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at");
    });

    await knex.raw(`
                 CREATE OR REPLACE FUNCTION update_updated_at_column()
                 RETURNS TRIGGER AS $$
                 BEGIN
                     NEW.updated_at = NOW();
                     RETURN NEW;
                 END;
                 $$ LANGUAGE plpgsql;
                 `);

    await knex.raw(`
                    CREATE TRIGGER update_wb_collection_updated_at
                    BEFORE UPDATE ON wb_box_tariffs
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                    `);
    return;
}

/** @returns {Promise<void>} */
export async function down(knex: Knex): Promise<void> {
    await knex.raw("DROP TRIGGER IF EXISTS update_wb_collection_updated_at ON wb_box_tariffs;");
    await knex.raw("DROP FUNCTION IF EXISTS update_updated_at_column;");
    await knex.schema.dropTable("wb_box_tariffs");
    await knex.raw("DROP TYPE IF EXISTS upload_status_type;");
    return;
}
