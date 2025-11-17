import crypto from "node:crypto";
import { TariffsBoxFormattedRecord, TariffsBoxParseResult, TariffsBoxStructuredResponse, TariffsBoxWarehouseMetrics } from "#features/tariffs-box/types.js";

type PlainObject = Record<string, unknown>;

export class TariffsBoxParser {
    parse(payload: unknown, rawId: string): TariffsBoxParseResult {
        const extracted = this.#extractData(payload);
        const formattedRows = extracted.warehouseList.map((warehouse, index) =>
            this.#buildFormattedRow(warehouse, rawId, index, extracted.dtNextBox, extracted.dtTillMax),
        );

        const structuredResponse: TariffsBoxStructuredResponse = {
            response: {
                data: {
                    dtNextBox: extracted.dtNextBox,
                    dtTillMax: extracted.dtTillMax,
                    warehouseList: extracted.warehouseList,
                },
            },
        };

        return {
            formattedRows,
            structuredResponse,
        };
    }

    #extractData(payload: unknown): {
        dtNextBox: string | null;
        dtTillMax: string | null;
        warehouseList: TariffsBoxWarehouseMetrics[];
    } {
        if (!this.#isPlainObject(payload)) {
            return { dtNextBox: null, dtTillMax: null, warehouseList: [] };
        }
        const response = payload.response;
        if (!this.#isPlainObject(response)) {
            return { dtNextBox: null, dtTillMax: null, warehouseList: [] };
        }
        const data = response.data;
        if (!this.#isPlainObject(data)) {
            return { dtNextBox: null, dtTillMax: null, warehouseList: [] };
        }

        const dtNextBox = this.#toNullableString(data.dtNextBox);
        const dtTillMax = this.#toNullableString(data.dtTillMax);
        const rawWarehouseList = Array.isArray(data.warehouseList) ? data.warehouseList : [];

        const warehouseList: TariffsBoxWarehouseMetrics[] = rawWarehouseList
            .map((item) => this.#normalizeWarehouse(item))
            .filter((item): item is TariffsBoxWarehouseMetrics => Boolean(item));

        return { dtNextBox, dtTillMax, warehouseList };
    }

    #normalizeWarehouse(entry: unknown): TariffsBoxWarehouseMetrics | null {
        if (!this.#isPlainObject(entry)) return null;
        return {
            geoName: this.#toNullableString(entry.geoName),
            warehouseName: this.#toNullableString(entry.warehouseName),
            boxDeliveryBase: this.#toNullableString(entry.boxDeliveryBase),
            boxDeliveryCoefExpr: this.#toNullableString(entry.boxDeliveryCoefExpr),
            boxDeliveryLiter: this.#toNullableString(entry.boxDeliveryLiter),
            boxDeliveryMarketplaceBase: this.#toNullableString(entry.boxDeliveryMarketplaceBase),
            boxDeliveryMarketplaceCoefExpr: this.#toNullableString(entry.boxDeliveryMarketplaceCoefExpr),
            boxDeliveryMarketplaceLiter: this.#toNullableString(entry.boxDeliveryMarketplaceLiter),
            boxStorageBase: this.#toNullableString(entry.boxStorageBase),
            boxStorageCoefExpr: this.#toNullableString(entry.boxStorageCoefExpr),
            boxStorageLiter: this.#toNullableString(entry.boxStorageLiter),
        };
    }

    #buildFormattedRow(
        warehouse: TariffsBoxWarehouseMetrics,
        rawId: string,
        index: number,
        dtNextBox: string | null,
        dtTillMax: string | null,
    ): TariffsBoxFormattedRecord {
        return {
            id: crypto.randomUUID(),
            rawId,
            dtNextBox,
            dtTillMax,
            geoName: warehouse.geoName,
            warehouseName: warehouse.warehouseName,
            boxDeliveryBase: warehouse.boxDeliveryBase,
            boxDeliveryCoefExpr: warehouse.boxDeliveryCoefExpr,
            boxDeliveryLiter: warehouse.boxDeliveryLiter,
            boxDeliveryMarketplaceBase: warehouse.boxDeliveryMarketplaceBase,
            boxDeliveryMarketplaceCoefExpr: warehouse.boxDeliveryMarketplaceCoefExpr,
            boxDeliveryMarketplaceLiter: warehouse.boxDeliveryMarketplaceLiter,
            boxStorageBase: warehouse.boxStorageBase,
            boxStorageCoefExpr: warehouse.boxStorageCoefExpr,
            boxStorageLiter: warehouse.boxStorageLiter,
            meta: {
                index,
                dtNextBox,
                dtTillMax,
                ...warehouse,
            },
        };
    }

    #toNullableString(value: unknown): string | null {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : null;
        }
        if (typeof value === "number") {
            return Number.isFinite(value) ? value.toString() : null;
        }
        return null;
    }

    #isPlainObject(value: unknown): value is PlainObject {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
}
