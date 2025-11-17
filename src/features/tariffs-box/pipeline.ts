import { TariffsBoxApiClient } from "#features/tariffs-box/apiClient.js";
import { GoogleSheetsExporter } from "#features/tariffs-box/googleSheetsExporter.js";
import { RawStorageService } from "#features/tariffs-box/rawStorage.js";
import { TariffsBoxRepository, TariffsBoxRawRepository, SpreadsheetRepository, buildRawSnapshotInput } from "#features/tariffs-box/repositories.js";
import { TariffsBoxParser } from "#features/tariffs-box/parser.js";
import { TariffsBoxPipelineResult } from "#features/tariffs-box/types.js";

export interface TariffsBoxPipelineDependencies {
    apiClient: TariffsBoxApiClient;
    rawStorage: RawStorageService;
    rawRepository: TariffsBoxRawRepository;
    formattedRepository: TariffsBoxRepository;
    parser: TariffsBoxParser;
    exporter: GoogleSheetsExporter;
    spreadsheetRepository: SpreadsheetRepository;
    logger?: Console;
}

export class TariffsBoxPipeline {
    #apiClient: TariffsBoxPipelineDependencies["apiClient"];
    #rawStorage: TariffsBoxPipelineDependencies["rawStorage"];
    #rawRepository: TariffsBoxPipelineDependencies["rawRepository"];
    #formattedRepository: TariffsBoxPipelineDependencies["formattedRepository"];
    #parser: TariffsBoxPipelineDependencies["parser"];
    #exporter: TariffsBoxPipelineDependencies["exporter"];
    #spreadsheetRepository: TariffsBoxPipelineDependencies["spreadsheetRepository"];
    #logger: Console;

    constructor(deps: TariffsBoxPipelineDependencies) {
        this.#apiClient = deps.apiClient;
        this.#rawStorage = deps.rawStorage;
        this.#rawRepository = deps.rawRepository;
        this.#formattedRepository = deps.formattedRepository;
        this.#parser = deps.parser;
        this.#exporter = deps.exporter;
        this.#spreadsheetRepository = deps.spreadsheetRepository;
        this.#logger = deps.logger ?? console;
    }

    async run(): Promise<TariffsBoxPipelineResult> {
        this.#logger.info("[tariffs-box] Starting pipeline");
        await this.#apiClient.ping();
        this.#logger.info("[tariffs-box] Ping successful");
        const apiResponse = await this.#apiClient.fetchTariffs();
        this.#logger.info("[tariffs-box] Payload fetched", {
            status: apiResponse.status,
            url: apiResponse.url,
        });

        const storageSnapshot = await this.#rawStorage.persist(apiResponse.payload, apiResponse.rawBody);
        this.#logger.info("[tariffs-box] Raw snapshot stored", storageSnapshot);

        const rawSnapshot = await this.#rawRepository.create(
            buildRawSnapshotInput({
                jsonPayload: JSON.stringify(apiResponse.payload),
                textPayload: apiResponse.rawBody,
                jsonPath: storageSnapshot.jsonPath,
                textPath: storageSnapshot.textPath,
                sourceUrl: apiResponse.url,
                statusCode: apiResponse.status,
                payloadHash: storageSnapshot.payloadHash,
            }),
        );
        this.#logger.info("[tariffs-box] Raw snapshot saved", { rawId: rawSnapshot.id });

        const parseResult = this.#parser.parse(apiResponse.payload, rawSnapshot.id);
        const formattedRows = parseResult.formattedRows;
        this.#logger.info("[tariffs-box] Parsed rows", { count: formattedRows.length });

        const replaced = await this.#formattedRepository.replaceForRawId(rawSnapshot.id, formattedRows);
        this.#logger.info("[tariffs-box] Formatted rows persisted", { count: replaced });

        const spreadsheetIds = await this.#spreadsheetRepository.getAllIds();
        this.#logger.info("[tariffs-box] Found spreadsheets to export", { count: spreadsheetIds.length });

        let totalExported = 0;
        const exportResults: Array<{ spreadsheetId: string; success: boolean; rowsExported: number; error?: string }> = [];

        for (const spreadsheetId of spreadsheetIds) {
            try {
                const exported = await this.#exporter.exportRows(formattedRows, spreadsheetId);
                totalExported += exported;
                exportResults.push({ spreadsheetId, success: true, rowsExported: exported });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.#logger.error(`[tariffs-box] Failed to export to spreadsheet ${spreadsheetId}`, { error: errorMessage });
                exportResults.push({ spreadsheetId, success: false, rowsExported: 0, error: errorMessage });
            }
        }

        this.#logger.info("[tariffs-box] Export summary", {
            totalSpreadsheets: spreadsheetIds.length,
            successful: exportResults.filter((r) => r.success).length,
            failed: exportResults.filter((r) => !r.success).length,
            totalRowsExported: totalExported,
        });

        return {
            rawSnapshotId: rawSnapshot.id,
            parsedRows: formattedRows.length,
            exportedRows: totalExported,
            skipped: false,
            structuredResponse: parseResult.structuredResponse,
            exportResults,
        };
    }
}
