import crypto from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { TariffsBoxApiClientConfig, TariffsBoxApiResponse } from "#features/tariffs-box/types.js";

export class TariffsBoxApiClient {
    #config: TariffsBoxApiClientConfig;
    #logger: Console;

    constructor(config: TariffsBoxApiClientConfig) {
        this.#config = config;
        this.#logger = console;
    }

    async fetchTariffs(): Promise<TariffsBoxApiResponse> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.#config.timeoutMs);
        const url = new URL(this.#config.endpoint, this.#config.baseUrl).toString();
        this.#logger?.log(`Fetching tariffs from ${url}`);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.#config.token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Request-Id": crypto.randomUUID(),
                },
                signal: controller.signal,
            });
            const rawBody = await response.text();
            if (!response.ok) {
                throw new ExternalApiError(`Failed to fetch tariffs. Status ${response.status}`, response.status, rawBody);
            }
            let payload: unknown;
            try {
                payload = rawBody.length > 0 ? JSON.parse(rawBody) : null;
            } catch (error) {
                throw new ExternalApiError("Tariffs response is not valid JSON", response.status, rawBody, error instanceof Error ? error : undefined);
            }
            return {
                payload,
                rawBody,
                status: response.status,
                url,
                fetchedAt: new Date(),
            };
        } catch (error) {
            if (error instanceof ExternalApiError) throw error;
            if (error instanceof Error && "name" in error && error.name === "AbortError") {
                throw new ExternalApiError("Tariffs request timed out", 408, "", error);
            }
            throw new ExternalApiError("Unexpected error while calling tariffs API", 500, "", error instanceof Error ? error : undefined);
        } finally {
            clearTimeout(timeout);
            // brief gap to avoid hammering remote API if called in a loop
            await delay(200);
        }
    }
}

export class ExternalApiError extends Error {
    readonly statusCode: number;
    readonly rawBody: string;
    readonly causeError?: Error;

    constructor(message: string, statusCode: number, rawBody: string, causeError?: Error) {
        super(message);
        this.statusCode = statusCode;
        this.rawBody = rawBody;
        this.causeError = causeError;
    }
}
