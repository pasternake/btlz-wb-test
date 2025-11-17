/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.text("raw_text").notNullable().defaultTo("{}");
        table.string("json_file_path");
        table.string("text_file_path");
        table.string("source_url");
        table.integer("status_code");
        table.string("payload_hash").index("tariffs_box_raw_hash_idx");
    });
    await knex("tariffs_box_raw")
        .update({
            raw_text: knex.ref("json_responce"),
        })
        .whereNull("raw_text")
        .orWhere("raw_text", "{}");
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box_raw", (table) => {
        table.dropColumn("raw_text");
        table.dropColumn("json_file_path");
        table.dropColumn("text_file_path");
        table.dropColumn("source_url");
        table.dropColumn("status_code");
        table.dropColumn("payload_hash");
    });
}
