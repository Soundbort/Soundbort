import Discord from "discord.js";
import path from "path";
import topGGStatsPoster from "topgg-autoposter";

import Logger from "../log";
import { logErr } from "../util/util";
import { TOP_GG_TOKEN, TOP_GG_WEBHOOK_TOKEN } from "../config";

import StatsCollectorManager from "./managers/StatsCollectorManager";
import WebhookManager from "./managers/WebhookManager";
import onInteractionCreate from "./events/onInteractionCreate";
import onVoiceStateUpdate from "./events/onVoiceStateUpdate";

import * as InteractionLoader from "./InteractionLoader";

const log = Logger.child({ label: "Core" });

export default class Core {
    public client: Discord.Client<true>;
    public stats_collector: StatsCollectorManager;

    constructor(client: Discord.Client<true>) {
        this.client = client;
        this.stats_collector = new StatsCollectorManager(this.client);

        if (TOP_GG_TOKEN) {
            topGGStatsPoster(TOP_GG_TOKEN, this.client)
                .on("posted", () => {
                    log.debug("Posted stats to Top.gg!");
                })
                .on("error", error => {
                    log.error("Top.gg posting error", { error: logErr(error) });
                });
        }
    }

    public async setup(): Promise<this> {
        log.info("Client ready. Running preparations...");

        // ///////////////////////

        const commands_path = path.join(__dirname, "..", "commands");

        await InteractionLoader.loadCommands(this.client, this.stats_collector, commands_path);

        await InteractionLoader.deployCommands(this.client);

        // ///////////////////

        this.attachListeners();

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
        this.client.on("interactionCreate", onInteractionCreate(this.stats_collector));

        // handle leaving voice channels when users go somewhere else
        this.client.on("voiceStateUpdate", onVoiceStateUpdate());
    }

    private setStatus(): void {
        this.client.user.setStatus("online");
        this.client.user.setActivity({
            type: "PLAYING",
            name: "your sound files",
        });
    }

    static async create(client: Discord.Client<true>): Promise<Core> {
        return await new Core(client).setup();
    }
}
