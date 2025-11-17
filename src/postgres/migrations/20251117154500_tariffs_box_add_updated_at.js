/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
    await knex("tariffs_box").update({
        updated_at: knex.fn.now(),
    });
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.index(["updated_at"], "tariffs_box_updated_at_idx");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.dropIndex(["updated_at"], "tariffs_box_updated_at_idx");
    });
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.dropColumn("updated_at");
    });
}
