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
            await trx("tariffs_box").insert(
                rows.map((row) => ({
                    id: row.id,
                    raw_id: row.rawId,
                    warehouse_name: row.warehouseName,
                    box_type: row.boxType,
                    delivery_type: row.deliveryType,
                    price: row.price === null ? null : row.price.toString(),
                    currency: row.currency,
                    weight_from: row.weightFrom === null ? null : row.weightFrom.toString(),
                    weight_to: row.weightTo === null ? null : row.weightTo.toString(),
                    meta: row.meta,
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
