import { migrate, seed } from "#postgres/knex.js";
import env from "#config/env/env.js";
import { TariffsBoxPipeline } from "#features/tariffs-box/pipeline.js";
import { TariffsBoxApiClient } from "#features/tariffs-box/apiClient.js";
import { RawStorageService } from "#features/tariffs-box/rawStorage.js";
import { TariffsBoxRawRepository, TariffsBoxRepository } from "#features/tariffs-box/repositories.js";
import { TariffsBoxParser } from "#features/tariffs-box/parser.js";
import { GoogleSheetsExporter } from "#features/tariffs-box/googleSheetsExporter.js";
import { TariffsBoxRetentionService } from "#features/tariffs-box/retentionService.js";
import { startSchedulers } from "#features/scheduler/taskScheduler.js";

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

    const retentionService = new TariffsBoxRetentionService({
        rawStorageDir: env.RAW_STORAGE_DIR,
        logger: console,
    });

    const runPipeline = async () => {
        const result = await pipeline.run();
        console.log("Tariffs pipeline finished", {
            rawSnapshotId: result.rawSnapshotId,
            parsedRows: result.parsedRows,
            exportedRows: result.exportedRows,
        });
        //TODO: uncomment after testing
        // console.log("Structured response:", JSON.stringify(result.structuredResponse, null, 2));
    };

    await runPipeline();
    await retentionService.purgeRawFiles(env.RAW_STORAGE_RETENTION_DAYS);
    await retentionService.purgeRawSnapshots(env.RAW_DB_RETENTION_DAYS);
    await retentionService.pruneTariffsBox();

    const scheduler = startSchedulers(
        {
            refreshPipeline: runPipeline,
            cleanupRawFiles: async () => {
                await retentionService.purgeRawFiles(env.RAW_STORAGE_RETENTION_DAYS);
            },
            cleanupRawSnapshots: async () => {
                await retentionService.purgeRawSnapshots(env.RAW_DB_RETENTION_DAYS);
            },
            pruneTariffsBox: async () => {
                await retentionService.pruneTariffsBox();
            },
        },
        {
            refreshIntervalMs: env.PIPELINE_REFRESH_INTERVAL_MINUTES * 60 * 1000,
            retentionIntervalMs: env.RETENTION_CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000,
            logger: console,
        },
    );

    const shutdown = () => {
        console.log("Shutting down schedulers...");
        scheduler.stop();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
    console.error("Fatal error while running application", error);
    process.exit(1);
});
