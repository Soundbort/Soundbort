import path from "node:path";
import dotenv from "dotenv";
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

const _OWNER_GUILD_IDS = process.env.SOUNDBORT_OWNER_GUILD_IDS;
if (!_OWNER_GUILD_IDS) throw new Error("No test guild id is specified.");
export const OWNER_GUILD_IDS = _OWNER_GUILD_IDS.split(",");

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

export const TOP_GG_TOKEN = process.env.SOUNDBORT_TOP_GG_TOKEN;

export const TOP_GG_WEBHOOK_TOKEN = process.env.SOUNDBORT_TOP_GG_WEBHOOK_TOKEN;

// ////////////// INFO //////////////

export const PROJECT_ROOT = path.normalize(path.join(__dirname, ".."));
export const ASSETS_DIR = path.join(PROJECT_ROOT, "assets");
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const LOGS_DIR = path.join(PROJECT_ROOT, "logs");

const package_file: PackageJson = fs.readJsonSync(path.join(PROJECT_ROOT, "package.json"));

export const VERSION = package_file.version as string + (
    ENVIRONMENT === EnvironmentStages.PROD
        ? ""
        : `-${ENVIRONMENT.toLowerCase()}`
);

export const METRICS_PORT = 6969;
export const WEBHOOK_PORT = 8080;
