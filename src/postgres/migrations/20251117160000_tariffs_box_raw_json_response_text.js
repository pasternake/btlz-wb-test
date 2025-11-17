/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.text("json_responce").alter();
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.string("json_responce", 255).alter();
    });
}
