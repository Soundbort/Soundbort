import "./util/banner-printer.js";

import * as Discord from "discord.js";

import Logger from "./log.js";
import { DISCORD_TOKEN } from "./config.js";
import { exit, onExit } from "./util/exit.js";
import Core from "./core/Core.js";
import * as database from "./modules/database/index.js";

const log = Logger.child({ label: "Index" });
const djs_log = Logger.child({ label: "discord.js" });

// ////////////// START BOT //////////////

const client = new Discord.Client({
    shards: "auto",

    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildVoiceStates,
    ],

    presence: {
        status: "dnd",
        activities: [{
            name: "Booting...",
            type: Discord.ActivityType.Playing,
        }],
    },

    // Do NOT cache anything the bot does not need to access frequently!
    // Drastically decreased memory usage
    makeCache: Discord.Options.cacheWithLimits({
        // cache application commands to be able fetch command id (and permissions? soon?)
        ApplicationCommandManager: Discord.Options.DefaultMakeCacheSettings.ApplicationCommandManager,
        BaseGuildEmojiManager: 0,
        GuildEmojiManager: 0,
        GuildBanManager: 0,
        GuildInviteManager: 0,
        // keep default, because of autocomplete checks for isModerator => lot of calls in short time, therefore enable cache
        GuildMemberManager: Discord.Options.DefaultMakeCacheSettings.GuildMemberManager,
        GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        // keep user cache default, because guild member cache depends on it
        UserManager: Discord.Options.DefaultMakeCacheSettings.UserManager,
        VoiceStateManager: Number.POSITIVE_INFINITY,
    }),
});

onExit(() => {
    log.debug("Destroying client...");
    client.destroy();
});

// ////////////// Attach Listeners //////////////

process.on("SIGTERM", signal => {
    log.debug(`Process ${process.pid} received a SIGTERM (${signal}) signal`);
    exit(0);
});

process.on("SIGINT", signal => {
    log.debug(`Process ${process.pid} has been interrupted (${signal})`);
    exit(0);
});

process.on("uncaughtException", error => {
    log.error(`Uncaught Exception: ${error.message}`, error);
    exit(1);
});

process.on("unhandledRejection", reason => {
    log.error("Unhandled rejection at", reason);
    exit(1);
});

client.on("debug", message => {
    if (/heartbeat/gi.test(message)) return;
    djs_log.debug(message);
});

client.on("warn", warn => { djs_log.warn(warn); });

client.on("error", error => { djs_log.error(error); });

client.on("shardDisconnect", (close_event, shard_id) => { djs_log.info(`Disconnected ID:${shard_id}`, close_event); });

client.on("shardReconnecting", shard_id => { djs_log.info(`Reconnecting ID:${shard_id}`); });

client.on("shardResume", (shard_id, replayed) => { djs_log.info(`Replayed ${replayed} events ID:${shard_id}`); });

client.on("shardReady", (shard_id, unavailable) => { djs_log.info(`Ready with ${unavailable?.size ?? 0} unavailable guilds ID:${shard_id}`); });

client.on("shardError", (error, shard_id) => { djs_log.error(`ID:${shard_id}`, error); });

// ////////////// Initialize Bot //////////////

try {
    await database.connect();

    const ready_promise = new Promise<Discord.Client<true>>(resolve => client.once("ready", resolve));

    djs_log.info("Logging in...");
    await client.login(DISCORD_TOKEN);
    djs_log.info("Login success");

    await Core.createInstance(await ready_promise);
} catch (error) {
    log.error("Failed to log in", error);
    exit(1);
}
