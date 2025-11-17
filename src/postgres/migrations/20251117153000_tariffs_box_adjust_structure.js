/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.string("dt_next_box");
        table.string("dt_till_max");
        table.string("geo_name");
        table.string("box_delivery_base");
        table.string("box_delivery_coef_expr");
        table.string("box_delivery_liter");
        table.string("box_delivery_marketplace_base");
        table.string("box_delivery_marketplace_coef_expr");
        table.string("box_delivery_marketplace_liter");
        table.string("box_storage_base");
        table.string("box_storage_coef_expr");
        table.string("box_storage_liter");

        table.dropColumn("box_type");
        table.dropColumn("delivery_type");
        table.dropColumn("price");
        table.dropColumn("currency");
        table.dropColumn("weight_from");
        table.dropColumn("weight_to");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box", (table) => {
        table.dropColumn("dt_next_box");
        table.dropColumn("dt_till_max");
        table.dropColumn("geo_name");
        table.dropColumn("box_delivery_base");
        table.dropColumn("box_delivery_coef_expr");
        table.dropColumn("box_delivery_liter");
        table.dropColumn("box_delivery_marketplace_base");
        table.dropColumn("box_delivery_marketplace_coef_expr");
        table.dropColumn("box_delivery_marketplace_liter");
        table.dropColumn("box_storage_base");
        table.dropColumn("box_storage_coef_expr");
        table.dropColumn("box_storage_liter");

        table.string("box_type");
        table.string("delivery_type");
        table.decimal("price", 14, 2);
        table.string("currency");
        table.decimal("weight_from", 14, 3);
        table.decimal("weight_to", 14, 3);
    });
}
