import "./util/banner/bannerPrinter";

import Discord from "discord.js";

import Logger from "./log";
import { DISCORD_TOKEN } from "./config";
import { exit } from "./util/exit";
import Core from "./core/Core";
import database from "./modules/database/index";
import { logErr } from "./util/util";

const log = Logger.child({ label: "Index" });
const djs_log = Logger.child({ label: "discord.js" });

// ////////////// START BOT //////////////

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
    ],

    presence: {
        status: "dnd",
        activities: [{
            name: "Booting...",
            type: "PLAYING",
        }],
    },
});

// ////////////// Attach Listeners //////////////

process.on("SIGTERM", signal => {
    log.debug(`Process ${process.pid} received a SIGTERM (${signal}) signal`);
    exit(client, 0);
});

process.on("SIGINT", signal => {
    log.debug(`Process ${process.pid} has been interrupted (${signal})`);
    exit(client, 0);
});

process.on("uncaughtException", error => {
    log.debug(`Uncaught Exception: ${error.message}`, { error });
    exit(client, 1);
});

process.on("unhandledRejection", (reason, promise) => {
    log.debug("Unhandled rejection at ", { promise });
    exit(client, 1);
});

client.on("debug", message => { djs_log.debug(message); });

client.on("warn", warn => { djs_log.warn(warn); });

client.on("error", error => { djs_log.error({ error: logErr(error) }); });

client.on("shardDisconnect", (close_event, shard_id) => { djs_log.info(`Disconnected ID:${shard_id}`, close_event); });

client.on("shardReconnecting", shard_id => { djs_log.info(`Reconnecting ID:${shard_id}`); });

client.on("shardResume", (shard_id, replayed) => { djs_log.info(`Replayed ${replayed} events ID:${shard_id}`); });

// ////////////// Initialize Bot //////////////

Promise.resolve()
    .then(async () => {
        await database.connect();

        const ready_promise = new Promise<Discord.Client<true>>(resolve => client.once("ready", resolve));

        djs_log.info("Logging in...");
        await client.login(DISCORD_TOKEN);
        djs_log.info("Login success");

        return await ready_promise;
    })
    .then(client => Core.create(client))
    .catch(error => {
        console.error(error);
        log.error({ error: logErr(error), message: "Failed to log in" });
        exit(client, 1);
    });
