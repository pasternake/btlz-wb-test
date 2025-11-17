import fs from "node:fs/promises";
import path from "node:path";
import knex from "#postgres/knex.js";
import { DbClient } from "#features/tariffs-box/types.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export interface RetentionServiceOptions {
    rawStorageDir: string;
    db?: DbClient;
    logger?: Console;
}

export class TariffsBoxRetentionService {
    #rawStorageDir: string;
    #db: DbClient;
    #logger: Console;

    constructor(options: RetentionServiceOptions) {
        this.#rawStorageDir = options.rawStorageDir;
        this.#db = options.db ?? knex;
        this.#logger = options.logger ?? console;
    }

    async purgeRawFiles(retentionDays: number): Promise<number> {
        const cutoff = Date.now() - retentionDays * MS_IN_DAY;
        let deleted = 0;
        try {
            const entries = await fs.readdir(this.#rawStorageDir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile()) continue;
                const fullPath = path.join(this.#rawStorageDir, entry.name);
                const stats = await fs.stat(fullPath);
                if (stats.mtimeMs < cutoff) {
                    await fs.rm(fullPath, { force: true });
                    deleted += 1;
                }
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                this.#logger.warn(`[retention] raw storage dir ${this.#rawStorageDir} not found; skipping cleanup`);
                return deleted;
            }
            this.#logger.error("[retention] Failed to purge raw files", error);
            throw error;
        }
        if (deleted > 0) {
            this.#logger.info(`[retention] Removed ${deleted} raw file(s) older than ${retentionDays} day(s)`);
        }
        return deleted;
    }

    async purgeRawSnapshots(retentionDays: number): Promise<number> {
        const result = await this.#db("tariffs_box_raw")
            .where("created_at", "<", this.#db.raw(`now() - interval '${retentionDays} days'`))
            .del();
        if (result > 0) {
            this.#logger.info(`[retention] Deleted ${result} tariffs_box_raw rows older than ${retentionDays} day(s)`);
        }
        return result;
    }

    async pruneTariffsBox(): Promise<void> {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const latestYesterday = await this.#db("tariffs_box")
            .select("raw_id")
            .where("updated_at", ">=", startOfYesterday)
            .andWhere("updated_at", "<", startOfToday)
            .orderBy("updated_at", "desc")
            .first();

        if (!latestYesterday) {
            // Nothing from yesterday; drop anything older than yesterday.
            await this.#db("tariffs_box").where("updated_at", "<", startOfYesterday).del();
            return;
        }

        await this.#db("tariffs_box").whereBetween("updated_at", [startOfYesterday, startOfToday]).whereNot("raw_id", latestYesterday.raw_id).del();

        await this.#db("tariffs_box").where("updated_at", "<", startOfYesterday).del();
    }
}
