import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value)),
    ]),
    WB_API_URL: z.string().url(),
    WB_API_ENDPOINT: z.string().default("/api/public/v1/tariffs-box"),
    WB_API_PING_ENDPOINT: z.string().default("/ping"),
    WB_API_TOKEN: z.string().default(""),
    WB_API_TIMEOUT_MS: z.union([z.string().regex(/^[0-9]+$/), z.undefined()]).transform((value) => parseInt(value ?? "10000", 10)),
    RAW_STORAGE_DIR: z.string().default("storage/raw"),
    GOOGLE_SPREADSHEET_ID: z.string(),
    GOOGLE_SHEET_RANGE: z.string().default("Tariffs!A1"),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().transform((value) => value.replace(/\\n/g, "\n")),
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_URL: process.env.WB_API_URL,
    WB_API_ENDPOINT: process.env.WB_API_ENDPOINT,
    WB_API_PING_ENDPOINT: process.env.WB_API_PING_ENDPOINT,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    WB_API_TIMEOUT_MS: process.env.WB_API_TIMEOUT_MS,
    RAW_STORAGE_DIR: process.env.RAW_STORAGE_DIR,
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID,
    GOOGLE_SHEET_RANGE: process.env.GOOGLE_SHEET_RANGE,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
});

export default env;
