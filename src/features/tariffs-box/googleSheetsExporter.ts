import { google, sheets_v4 } from "googleapis";
import { TariffsBoxFormattedRecord } from "#features/tariffs-box/types.js";

export interface GoogleSheetsExporterConfig {
    range: string;
    clientEmail: string;
    privateKey: string;
}

export class GoogleSheetsExporter {
    #config: GoogleSheetsExporterConfig;
    #client: sheets_v4.Sheets;
    #logger: Console;

    constructor(config: GoogleSheetsExporterConfig, logger?: Console) {
        this.#config = config;
        this.#logger = logger ?? console;
        const auth = new google.auth.JWT({
            email: config.clientEmail,
            key: config.privateKey,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        this.#client = google.sheets({ version: "v4", auth });
    }

    async exportRows(rows: TariffsBoxFormattedRecord[], spreadsheetId: string): Promise<number> {
        if (rows.length === 0) {
            return 0;
        }
        const values = [
            [
                "dtNextBox",
                "dtTillMax",
                "geoName",
                "warehouseName",
                "boxDeliveryBase",
                "boxDeliveryCoefExpr",
                "boxDeliveryLiter",
                "boxDeliveryMarketplaceBase",
                "boxDeliveryMarketplaceCoefExpr",
                "boxDeliveryMarketplaceLiter",
                "boxStorageBase",
                "boxStorageCoefExpr",
                "boxStorageLiter",
                "rawId",
                "recordId",
            ],
            ...rows.map((row) => [
                row.dtNextBox ?? "",
                row.dtTillMax ?? "",
                row.geoName ?? "",
                row.warehouseName ?? "",
                row.boxDeliveryBase ?? "",
                row.boxDeliveryCoefExpr ?? "",
                row.boxDeliveryLiter ?? "",
                row.boxDeliveryMarketplaceBase ?? "",
                row.boxDeliveryMarketplaceCoefExpr ?? "",
                row.boxDeliveryMarketplaceLiter ?? "",
                row.boxStorageBase ?? "",
                row.boxStorageCoefExpr ?? "",
                row.boxStorageLiter ?? "",
                row.rawId,
                row.id,
            ]),
        ];

        try {
            await this.#client.spreadsheets.values.update({
                spreadsheetId,
                range: this.#config.range,
                valueInputOption: "RAW",
                requestBody: {
                    values,
                },
            });
            this.#logger?.info(`[tariffs-box] Exported ${rows.length} rows to spreadsheet ${spreadsheetId}`);
            return rows.length;
        } catch (error) {
            this.#logger?.error(`[tariffs-box] Failed to export to spreadsheet ${spreadsheetId}`, error);
            throw error;
        }
    }
}
