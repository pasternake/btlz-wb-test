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

    async ping(): Promise<void> {
        const url = this.#buildUrl(this.#config.pingEndpoint);
        this.#logger?.log(`[tariffs-box] Pinging ${url}`);
        const response = await this.#safeFetch(url);
        const body = await response.text();
        if (!response.ok) {
            throw new ExternalApiError(`Ping failed with status ${response.status}`, response.status, body);
        }
        this.#logger?.log("[tariffs-box] Ping succeeded");
    }

    async fetchTariffs(): Promise<TariffsBoxApiResponse> {
        // Use current date in YYYY-MM-DD format.
        // TODO: consider as parameter if needed
        const currentDateISO = new Date().toISOString().split("T")[0];
        const url = this.#buildUrl(this.#config.endpoint) + `?date=${encodeURIComponent(currentDateISO)}`;
        this.#logger?.log(`Fetching tariffs from ${url}`);
        const response = await this.#safeFetch(url);
        try {
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
        } finally {
            // brief gap to avoid hammering remote API if called in a loop
            await delay(200);
        }
    }

    #buildUrl(endpoint: string): string {
        try {
            return new URL(endpoint, this.#config.baseUrl).toString();
        } catch {
            return endpoint;
        }
    }

    async #safeFetch(url: string): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.#config.timeoutMs);
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
            return response;
        } catch (error) {
            if (error instanceof Error && "name" in error && error.name === "AbortError") {
                throw new ExternalApiError("Request timed out", 408, "", error);
            }
            throw new ExternalApiError("Unexpected error while calling tariffs API", 500, "", error instanceof Error ? error : undefined);
        } finally {
            clearTimeout(timeout);
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
