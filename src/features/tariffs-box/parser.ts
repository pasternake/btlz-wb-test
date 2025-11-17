import crypto from "node:crypto";
import { TariffsBoxFormattedRecord } from "#features/tariffs-box/types.js";

type PlainObject = Record<string, unknown>;

export class TariffsBoxParser {
    parse(payload: unknown, rawId: string): TariffsBoxFormattedRecord[] {
        const candidates = this.#collectCandidates(payload);
        return candidates.map((candidate, index) => ({
            id: crypto.randomUUID(),
            rawId,
            warehouseName: this.#pickString(candidate, ["warehouseName", "warehouse", "warehouseTitle", "warehouse_name"]),
            boxType: this.#pickString(candidate, ["boxType", "box_type", "packageType", "type"]),
            deliveryType: this.#pickString(candidate, ["deliveryType", "delivery", "deliveryScheme"]),
            price: this.#pickNumber(candidate, ["price", "cost", "tariff", "amount"]),
            currency: this.#pickString(candidate, ["currency", "currencyCode"]),
            weightFrom: this.#pickNumber(candidate, ["weightFrom", "minWeight", "weightMin"]),
            weightTo: this.#pickNumber(candidate, ["weightTo", "maxWeight", "weightMax"]),
            meta: {
                index,
                candidate,
            },
        }));
    }

    #collectCandidates(payload: unknown): PlainObject[] {
        const result: PlainObject[] = [];
        const stack: unknown[] = [payload];
        while (stack.length > 0) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (const item of current) stack.push(item);
                continue;
            }
            if (current && typeof current === "object") {
                const obj = current as PlainObject;
                if (this.#looksLikeTariff(obj)) {
                    result.push(obj);
                }
                for (const value of Object.values(obj)) {
                    if (value && (Array.isArray(value) || typeof value === "object")) {
                        stack.push(value);
                    }
                }
            }
        }
        return result;
    }

    #looksLikeTariff(obj: PlainObject): boolean {
        const keys = Object.keys(obj);
        const priceHints = ["price", "cost", "amount", "tariff"];
        const hasPrice = keys.some((key) => priceHints.includes(key));
        const hasWarehouse = keys.some((key) => key.toLowerCase().includes("warehouse"));
        const hasBox = keys.some((key) => key.toLowerCase().includes("box") || key.toLowerCase().includes("package"));
        return hasPrice || (hasWarehouse && hasBox);
    }

    #pickString(obj: PlainObject, keys: string[]): string | null {
        for (const key of keys) {
            const value = obj[key];
            if (typeof value === "string" && value.trim().length > 0) {
                return value;
            }
        }
        return null;
    }

    #pickNumber(obj: PlainObject, keys: string[]): number | null {
        for (const key of keys) {
            const value = obj[key];
            const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
            if (numberValue !== null && Number.isFinite(numberValue)) {
                return numberValue;
            }
        }
        return null;
    }
}

