import { TariffsBoxApiClient } from "#features/tariffs-box/apiClient.js";
import { GoogleSheetsExporter } from "#features/tariffs-box/googleSheetsExporter.js";
import { RawStorageService } from "#features/tariffs-box/rawStorage.js";
import { TariffsBoxRepository, TariffsBoxRawRepository, buildRawSnapshotInput } from "#features/tariffs-box/repositories.js";
import { TariffsBoxParser } from "#features/tariffs-box/parser.js";
import { TariffsBoxPipelineResult } from "#features/tariffs-box/types.js";

export interface TariffsBoxPipelineDependencies {
    apiClient: TariffsBoxApiClient;
    rawStorage: RawStorageService;
    rawRepository: TariffsBoxRawRepository;
    formattedRepository: TariffsBoxRepository;
    parser: TariffsBoxParser;
    exporter: GoogleSheetsExporter;
    logger?: Console;
}

export class TariffsBoxPipeline {
    #apiClient: TariffsBoxPipelineDependencies["apiClient"];
    #rawStorage: TariffsBoxPipelineDependencies["rawStorage"];
    #rawRepository: TariffsBoxPipelineDependencies["rawRepository"];
    #formattedRepository: TariffsBoxPipelineDependencies["formattedRepository"];
    #parser: TariffsBoxPipelineDependencies["parser"];
    #exporter: TariffsBoxPipelineDependencies["exporter"];
    #logger: Console;

    constructor(deps: TariffsBoxPipelineDependencies) {
        this.#apiClient = deps.apiClient;
        this.#rawStorage = deps.rawStorage;
        this.#rawRepository = deps.rawRepository;
        this.#formattedRepository = deps.formattedRepository;
        this.#parser = deps.parser;
        this.#exporter = deps.exporter;
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

        const exported = await this.#exporter.exportRows(formattedRows);
        this.#logger.info("[tariffs-box] Exported rows to Google Sheets", { exported });

        return {
            rawSnapshotId: rawSnapshot.id,
            parsedRows: formattedRows.length,
            exportedRows: exported,
            skipped: false,
            structuredResponse: parseResult.structuredResponse,
        };
    }
}
