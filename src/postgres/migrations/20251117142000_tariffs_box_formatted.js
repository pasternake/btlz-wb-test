/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("tariffs_box", (table) => {
        table.string("id").primary();
        table.string("raw_id").notNullable().references("id").inTable("tariffs_box_raw").onDelete("CASCADE");
        table.string("warehouse_name");
        table.string("box_type");
        table.string("delivery_type");
        table.decimal("price", 14, 2);
        table.string("currency");
        table.decimal("weight_from", 14, 3);
        table.decimal("weight_to", 14, 3);
        table.jsonb("meta").notNullable();
        table.timestamp("parsed_at").defaultTo(knex.fn.now());

        table.index(["raw_id"], "tariffs_box_raw_id_idx");
        table.index(["warehouse_name"], "tariffs_box_warehouse_idx");
        table.index(["box_type"], "tariffs_box_box_type_idx");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTable("tariffs_box");
}
