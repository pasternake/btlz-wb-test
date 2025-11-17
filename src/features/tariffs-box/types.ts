import type { Knex } from "knex";

export interface TariffsBoxApiClientConfig {
    baseUrl: string;
    endpoint: string;
    pingEndpoint: string;
    token: string;
    timeoutMs: number;
}

export interface TariffsBoxApiResponse<TPayload = unknown> {
    payload: TPayload;
    rawBody: string;
    status: number;
    url: string;
    fetchedAt: Date;
}

export interface RawStorageOptions {
    baseDir: string;
}

export interface RawStorageSnapshot {
    jsonPath: string;
    textPath: string;
    bytesWritten: number;
    payloadHash: string;
}

export interface CreateRawSnapshotInput {
    id: string;
    jsonPayload: string;
    textPayload: string;
    jsonPath: string;
    textPath: string;
    sourceUrl: string;
    statusCode: number;
    payloadHash: string;
}

export interface TariffsBoxRawRecord extends CreateRawSnapshotInput {
    created_at: Date;
}

export interface TariffsBoxFormattedRecord {
    id: string;
    rawId: string;
    dtNextBox: string | null;
    dtTillMax: string | null;
    geoName: string | null;
    warehouseName: string | null;
    boxDeliveryBase: string | null;
    boxDeliveryCoefExpr: string | null;
    boxDeliveryLiter: string | null;
    boxDeliveryMarketplaceBase: string | null;
    boxDeliveryMarketplaceCoefExpr: string | null;
    boxDeliveryMarketplaceLiter: string | null;
    boxStorageBase: string | null;
    boxStorageCoefExpr: string | null;
    boxStorageLiter: string | null;
    meta: Record<string, unknown>;
}

export interface TariffsBoxWarehouseMetrics {
    geoName: string | null;
    warehouseName: string | null;
    boxDeliveryBase: string | null;
    boxDeliveryCoefExpr: string | null;
    boxDeliveryLiter: string | null;
    boxDeliveryMarketplaceBase: string | null;
    boxDeliveryMarketplaceCoefExpr: string | null;
    boxDeliveryMarketplaceLiter: string | null;
    boxStorageBase: string | null;
    boxStorageCoefExpr: string | null;
    boxStorageLiter: string | null;
}

export interface TariffsBoxStructuredResponse {
    response: {
        data: {
            dtNextBox: string | null;
            dtTillMax: string | null;
            warehouseList: TariffsBoxWarehouseMetrics[];
        };
    };
}

export interface TariffsBoxParseResult {
    formattedRows: TariffsBoxFormattedRecord[];
    structuredResponse: TariffsBoxStructuredResponse;
}

export interface TariffsBoxPipelineResult {
    rawSnapshotId: string;
    parsedRows: number;
    exportedRows: number;
    skipped: boolean;
    structuredResponse: TariffsBoxStructuredResponse;
    exportResults?: Array<{ spreadsheetId: string; success: boolean; rowsExported: number; error?: string }>;
}

export type DbClient = Knex;
