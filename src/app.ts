import { migrate, seed } from "#postgres/knex.js";
import env from "#config/env/env.js";
import { TariffsBoxPipeline } from "#features/tariffs-box/pipeline.js";
import { TariffsBoxApiClient } from "#features/tariffs-box/apiClient.js";
import { RawStorageService } from "#features/tariffs-box/rawStorage.js";
import { TariffsBoxRawRepository, TariffsBoxRepository } from "#features/tariffs-box/repositories.js";
import { TariffsBoxParser } from "#features/tariffs-box/parser.js";
import { GoogleSheetsExporter } from "#features/tariffs-box/googleSheetsExporter.js";

async function bootstrap() {
    await migrate.latest();
    await seed.run();
    console.log("All migrations and seeds have been run");

    const pipeline = new TariffsBoxPipeline({
        apiClient: new TariffsBoxApiClient({
            baseUrl: env.WB_API_URL,
            endpoint: env.WB_API_ENDPOINT,
            pingEndpoint: env.WB_API_PING_ENDPOINT,
            token: env.WB_API_TOKEN,
            timeoutMs: env.WB_API_TIMEOUT_MS,
        }),
        rawStorage: new RawStorageService({
            baseDir: env.RAW_STORAGE_DIR,
        }),
        rawRepository: new TariffsBoxRawRepository(),
        formattedRepository: new TariffsBoxRepository(),
        parser: new TariffsBoxParser(),
        exporter: new GoogleSheetsExporter({
            spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
            range: env.GOOGLE_SHEET_RANGE,
            clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
        }),
        logger: console,
    });

    const result = await pipeline.run();
    console.log("Tariffs pipeline finished", {
        rawSnapshotId: result.rawSnapshotId,
        parsedRows: result.parsedRows,
        exportedRows: result.exportedRows,
    });
    console.log("Structured response:", JSON.stringify(result.structuredResponse, null, 2));
}

bootstrap().catch((error) => {
    console.error("Fatal error while running application", error);
    process.exit(1);
});
