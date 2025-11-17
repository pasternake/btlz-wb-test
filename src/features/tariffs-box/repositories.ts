import crypto from "node:crypto";
import knex from "#postgres/knex.js";
import { CreateRawSnapshotInput, DbClient, TariffsBoxFormattedRecord, TariffsBoxRawRecord } from "#features/tariffs-box/types.js";

export class TariffsBoxRawRepository {
    #db: DbClient;
    #logger: Console;

    constructor(db: DbClient = knex) {
        this.#db = db;
        this.#logger = console;
    }

    async create(payload: CreateRawSnapshotInput): Promise<TariffsBoxRawRecord> {
        const record = {
            id: payload.id,
            json_responce: payload.jsonPayload,
            raw_text: payload.textPayload,
            json_file_path: payload.jsonPath,
            text_file_path: payload.textPath,
            source_url: payload.sourceUrl,
            status_code: payload.statusCode,
            payload_hash: payload.payloadHash,
        };
        this.#logger?.debug("[tariffs-box] Inserting raw snapshot record", { JSON: JSON.stringify(record) });
        const [row] = await this.#db("tariffs_box_raw").insert(record).returning("*");
        return row as TariffsBoxRawRecord;
    }
}

export class TariffsBoxRepository {
    #db: DbClient;

    constructor(db: DbClient = knex) {
        this.#db = db;
    }

    async replaceForRawId(rawId: string, rows: TariffsBoxFormattedRecord[]): Promise<number> {
        return this.#db.transaction(async (trx) => {
            await trx("tariffs_box").where({ raw_id: rawId }).del();
            if (rows.length === 0) return 0;
            const now = trx.fn.now();
            await trx("tariffs_box").insert(
                rows.map((row) => ({
                    id: row.id,
                    raw_id: row.rawId,
                    dt_next_box: row.dtNextBox,
                    dt_till_max: row.dtTillMax,
                    geo_name: row.geoName,
                    warehouse_name: row.warehouseName,
                    box_delivery_base: row.boxDeliveryBase,
                    box_delivery_coef_expr: row.boxDeliveryCoefExpr,
                    box_delivery_liter: row.boxDeliveryLiter,
                    box_delivery_marketplace_base: row.boxDeliveryMarketplaceBase,
                    box_delivery_marketplace_coef_expr: row.boxDeliveryMarketplaceCoefExpr,
                    box_delivery_marketplace_liter: row.boxDeliveryMarketplaceLiter,
                    box_storage_base: row.boxStorageBase,
                    box_storage_coef_expr: row.boxStorageCoefExpr,
                    box_storage_liter: row.boxStorageLiter,
                    meta: row.meta,
                    updated_at: now,
                })),
            );
            return rows.length;
        });
    }
}

export function buildRawSnapshotInput(params: {
    jsonPayload: string;
    textPayload: string;
    jsonPath: string;
    textPath: string;
    sourceUrl: string;
    statusCode: number;
    payloadHash: string;
}): CreateRawSnapshotInput {
    return {
        id: crypto.randomUUID(),
        ...params,
    };
}
