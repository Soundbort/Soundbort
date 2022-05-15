import path from "node:path";
import * as Discord from "discord.js";
import { AutoPoster as topGGStatsPoster } from "topgg-autoposter";
import { CronJob } from "cron";

import Logger from "../log";
import { SAMPLE_TYPES } from "../const";
import { TOP_GG_TOKEN, TOP_GG_WEBHOOK_TOKEN } from "../config";

import timer from "../util/timer";
import { walk } from "../util/files";
import { CmdInstallerFile } from "../util/types";

import WebhookListener from "./WebhookListener";
import AdminPermissions from "./permissions/AdminPermissions";
import StatsCollectorManager from "./data-managers/StatsCollectorManager";
import DataDeletionManager from "./data-managers/DataDeletionManager";
import GuildConfigManager from "./data-managers/GuildConfigManager";
import InteractionRepliesManager from "./data-managers/InteractionRepliesManager";
import onInteractionCreate from "./events/onInteractionCreate";
import onVoiceStateUpdate from "./events/onVoiceStateUpdate";
import onGuildCreate from "./events/onGuildCreate";
import onGuildDelete from "./events/onGuildDelete";

import InteractionRegistry from "./InteractionRegistry";

import { CustomSample } from "./soundboard/CustomSample";

const log = Logger.child({ label: "Core" });

let instance: Core;

export default class Core {
    public client: Discord.Client<true>;

    private data_deletion_job = new CronJob({
        cronTime: "0 0 * * * *",
        onTick: () => this.doDataDeletion().catch(error => log.error("Scheduled data deletion failed", error)),
    });

    private stats_collector_job = new CronJob({
        cronTime: "0 */10 * * * *",
        onTick: () => StatsCollectorManager.collect(this.client).catch(error => log.error("Error while collecting stats", error)),
    });

    private constructor(client: Discord.Client<true>) {
        this.client = client;

        if (TOP_GG_TOKEN) {
            topGGStatsPoster(TOP_GG_TOKEN, this.client)
                .on("posted", () => {
                    log.debug("Posted stats to Top.gg!");
                })
                .on("error", error => {
                    log.error("Top.gg posting error", error);
                });
        }
    }

    public async setup(): Promise<this> {
        log.info("Client ready. Running preparations...");

        // ////////// INSTALL COMMANDS ///////////

        log.info("Installing Commands...");

        const install_start = timer();
        const registry = new InteractionRegistry();

        const commands_path = path.join(__dirname, "..", "commands");
        const files = await walk(commands_path)
            .then(files => files.filter(file => /\.(ts|js)$/.test(file)));

        const installer_args = {
            client: this.client,
            registry,
            admin: new AdminPermissions(this.client, registry),
        };

        await Promise.all(files.map(async file => {
            const start = timer();
            const relative_path = path.relative(path.join(__dirname, ".."), file);

            try {
                const install = await import(file) as CmdInstallerFile;
                await install.install?.(installer_args);
            } catch (error) {
                log.error("failed   : %s", relative_path);
                throw error;
            }

            log.debug("installed: %s %s ms", relative_path, timer.diffMs(start).toFixed(3));
        }));

        const install_time = timer.diff(install_start) / timer.NS_PER_SEC;

        log.info(`Commands installed. files:${files.length} commands:${registry.commands.size} install_time:${install_time.toFixed(3)}s`);

        // ////////// DEPLOY COMMANDS ///////////

        await registry.deployCommands(this.client);

        // ///////// ATTACH LISTENERS //////////

        this.client.on("interactionCreate", onInteractionCreate(registry));

        // handle leaving voice channels when users go somewhere else
        this.client.on("voiceStateUpdate", onVoiceStateUpdate());

        this.client.on("guildCreate", onGuildCreate());

        this.client.on("guildDelete", onGuildDelete());

        this.compareGuildsAndEmit().catch(error => log.error("Failed comparing guilds", error));

        this.data_deletion_job.start();
        this.stats_collector_job.start();

        // ///////////////////

        StatsCollectorManager.listen();
        if (TOP_GG_WEBHOOK_TOKEN) WebhookListener.listen();

        // Make sure a status is always set. When reconnecting
        // it is sometimes reset
        this.setStatus();
        this.client.on("shardReady", () => this.setStatus());
        this.client.on("shardResume", () => this.setStatus());

        // ///////////////////

        log.info(`Ready. Logged in as ${this.client.user.tag}`);

        return this;
    }

    private setStatus(): void {
        this.client.user.setStatus("online");
        this.client.user.setActivity({
            type: "PLAYING",
            name: "your sound files",
        });
    }

    private async doDataDeletion(): Promise<void> {
        const deletableGuildIds = await DataDeletionManager.getDeletableGuildIds();

        for (const guildId of deletableGuildIds) {
            try {
                // TODO when sharding, do broadcastEval
                if (this.client.guilds.cache.has(guildId)) {
                    await DataDeletionManager.unmarkGuildForDeletion(guildId);
                    continue;
                }

                await Promise.all([
                    GuildConfigManager.removeConfig(guildId),
                    CustomSample.removeAll(guildId, SAMPLE_TYPES.SERVER),
                    CustomSample.removeSlots(guildId),
                    InteractionRepliesManager.removeFromGuild(guildId),
                    DataDeletionManager.finallyRemoveGuild(guildId),
                ]);

                log.debug("Scheduled data deletion of '%s' succeeded", guildId);
            } catch (error) {
                log.error("Scheduled data deletion for '%s' failed", guildId, error);
            }
        }
    }

    private async compareGuildsAndEmit(): Promise<void> {
        /**
         * In this function we go over and compare the set of guilds from the database
         * to the set of guilds that we are currently part of acording to the discord api.
         * Because during bot downtime, we cannot capture guildCreate and guildDelete events.
         *
         * Here we only add guilds that the database currently doesn't know about, and don't
         * delete the guilds that are not part of the list from the discord api! Because the
         * guilds could be part of another shard and therefore not in the list of guilds this shard
         * has access to. We would delete guilds that we are actually still part of but this shard
         * doesn't know that we are!
         */
        const activeGuildIds = this.client.guilds.cache.map(guild => guild.id);

        const newGuildIds = await DataDeletionManager.getNewGuilds(activeGuildIds);

        const onGuildCreateFunc = onGuildCreate();

        for (const guildId of newGuildIds) {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) continue;

            await onGuildCreateFunc(guild);
        }
    }

    /**
     * Prevent multiple instances being created, which is NOT supported!
     */
    static async createInstance(client: Discord.Client<true>): Promise<Core> {
        if (instance) {
            return instance;
        }
        return await (instance = new Core(client)).setup();
    }
}
