/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([
            { spreadsheet_id: "some_spreadsheet" },
            { spreadsheet_id: "1Cw9YHlyyY9Kgxw2dGFDGd8b-cChsbgxMPE7rtS8s4PU" },
            { spreadsheet_id: "1hQuex3DBtmQVFO3dOYg7HmAl_RiyC9wod0wS3d3YHsY" },
        ])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
