import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";
import { PackageJson } from "type-fest";

dotenv.config();

// ////////////// REQUIRED //////////////

const _BOT_NAME = process.env.SOUNDBORT_BOT_NAME;
if (!_BOT_NAME) throw new Error("No bot name is specified.");
export const BOT_NAME = _BOT_NAME;

const _OWNER_IDS = process.env.SOUNDBORT_OWNER_IDS;
if (!_OWNER_IDS) throw new Error("No owner id is specified.");
export const OWNER_IDS = _OWNER_IDS.split(",");

const _DISCORD_TOKEN = process.env.SOUNDBORT_DISCORD_TOKEN;
if (!_DISCORD_TOKEN) throw new Error("No Discord API Token specified in config files");
export const DISCORD_TOKEN = _DISCORD_TOKEN;

// ////////////// OPTIONAL //////////////

// https://cloud.mongodb.com
export const DB_URI = process.env.SOUNDBORT_DB_URI || "mongodb://localhost:27017/soundbort";

export enum EnvironmentStages {
    DEVEL = "DEVEL",
    STAGING = "STAGING",
    PROD = "PROD",
}
const _ENV = (node_env: string | undefined): EnvironmentStages => {
    switch (node_env) {
        case "development": return EnvironmentStages.DEVEL;
        case "staging": return EnvironmentStages.STAGING;
        case "production": return EnvironmentStages.PROD;
    }
    throw new Error("NODE_ENV must be of \"development\", \"staging\" or \"production\"");
};

export const ENVIRONMENT = _ENV(process.env.NODE_ENV);

// ////////////// INFO //////////////

const package_file: PackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"));

export const VERSION = package_file.version as string;

export const PROJECT_ROOT = path.resolve(__dirname, "..");

export const DATA_BASE = path.resolve(PROJECT_ROOT, "data");

export const METRICS_PORT = 6969;
