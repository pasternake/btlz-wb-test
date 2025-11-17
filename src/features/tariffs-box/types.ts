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
    warehouseName: string | null;
    boxType: string | null;
    deliveryType: string | null;
    price: number | null;
    currency: string | null;
    weightFrom: number | null;
    weightTo: number | null;
    meta: Record<string, unknown>;
}

export interface TariffsBoxPipelineResult {
    rawSnapshotId: string;
    parsedRows: number;
    exportedRows: number;
    skipped: boolean;
}

export type DbClient = Knex;
