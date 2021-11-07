import Discord from "discord.js";
import topGGStatsPoster from "topgg-autoposter";
import { CronJob } from "cron";

import Logger from "../log.js";
import { SAMPLE_TYPES } from "../const.js";
import { TOP_GG_TOKEN, TOP_GG_WEBHOOK_TOKEN } from "../config.js";

import StatsCollectorManager from "./data-managers/StatsCollectorManager.js";
import WebhookManager from "./managers/WebhookManager.js";
import DataDeletionManager from "./data-managers/DataDeletionManager.js";
import GuildConfigManager from "./data-managers/GuildConfigManager.js";
import InteractionRepliesManager from "./data-managers/InteractionRepliesManager.js";
import onInteractionCreate from "./events/onInteractionCreate.js";
import onVoiceStateUpdate from "./events/onVoiceStateUpdate.js";
import onGuildCreate from "./events/onGuildCreate.js";
import onGuildDelete from "./events/onGuildDelete.js";

import * as InteractionLoader from "./InteractionLoader.js";

import { CustomSample } from "./soundboard/CustomSample.js";

const log = Logger.child({ label: "Core" });

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

    constructor(client: Discord.Client<true>) {
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

        // ///////////////////////

        await InteractionLoader.loadCommands(this.client);
        await InteractionLoader.deployCommands(this.client);

        // ///////////////////

        this.attachListeners();

        this.compareGuildsAndEmit().catch(error => log.error("Failed comparing guilds", error));

        this.data_deletion_job.start();
        this.stats_collector_job.start();

        // ///////////////////

        StatsCollectorManager.listen();
        if (TOP_GG_WEBHOOK_TOKEN) WebhookManager.listen();

        this.setStatus();
        this.client.on("shardReady", () => this.setStatus());
        this.client.on("shardResume", () => this.setStatus());

        log.info(`Ready. Logged in as ${this.client.user.tag}`);

        return this;
    }

    private attachListeners(): void {
        this.client.on("interactionCreate", onInteractionCreate());

        // handle leaving voice channels when users go somewhere else
        this.client.on("voiceStateUpdate", onVoiceStateUpdate());

        this.client.on("guildCreate", onGuildCreate());

        this.client.on("guildDelete", onGuildDelete());
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

    static async create(client: Discord.Client<true>): Promise<Core> {
        return await new Core(client).setup();
    }
}
