import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
    RawStorageOptions,
    RawStorageSnapshot,
} from "#features/tariffs-box/types.js";

export class RawStorageService {
    #options: RawStorageOptions;

    constructor(options: RawStorageOptions) {
        this.#options = options;
    }

    async persist(payload: unknown, rawBody: string): Promise<RawStorageSnapshot> {
        const payloadString = JSON.stringify(payload, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileBase = `tariffs-box-${timestamp}`;
        const jsonPath = path.resolve(this.#options.baseDir, `${fileBase}.json`);
        const textPath = path.resolve(this.#options.baseDir, `${fileBase}.txt`);

        await fs.mkdir(this.#options.baseDir, { recursive: true });
        await fs.writeFile(jsonPath, payloadString, "utf-8");
        await fs.writeFile(textPath, rawBody || payloadString, "utf-8");

        const payloadHash = crypto.createHash("sha256").update(rawBody || payloadString).digest("hex");
        const bytesWritten = Buffer.byteLength(rawBody || payloadString, "utf-8");

        return {
            jsonPath,
            textPath,
            bytesWritten,
            payloadHash,
        };
    }
}

