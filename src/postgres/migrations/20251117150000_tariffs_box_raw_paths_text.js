/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.text("json_file_path").alter();
        table.text("text_file_path").alter();
        table.text("source_url").alter();
        table.text("payload_hash").alter();
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.string("json_file_path", 255).alter();
        table.string("text_file_path", 255).alter();
        table.string("source_url", 255).alter();
        table.string("payload_hash", 255).alter();
    });
}

