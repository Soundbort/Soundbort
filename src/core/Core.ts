import Discord from "discord.js";
import path from "path";
import topGGStatsPoster from "topgg-autoposter";

import nanoTimer from "../modules/nanoTimer";
import Logger from "../log";
import { StatsCollectorManager } from "./StatsCollectorManager";
import { walk } from "../util/files";
import { CmdInstallerArgs, CmdInstallerFile } from "../util/types";
import InteractionRegistry from "./InteractionRegistry";
import { TOP_GG_TOKEN } from "../config";
import { EmbedType, guessModRole, logErr, replyEmbedEphemeral } from "../util/util";
import AudioManager from "./audio/AudioManager";
import GuildConfigManager from "./GuildConfigManager";
import { collectionBlacklistUser } from "../modules/database/models";
import { BUTTON_TYPES } from "../const";

const log = Logger.child({ label: "Core" });

export default class Core {
    client: Discord.Client<true>;
    stats_collector: StatsCollectorManager;

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

    async setup(): Promise<void> {
        log.info("Client ready. Running preparations...");

        // ///////////////////////

        const commands_path = path.join(__dirname, "..", "commands");

        await this.loadCommands(commands_path);

        // ///////////////////

        await this.deployCommands();

        // ///////////////////

        this.attachListeners();

        this.client.user.setStatus("online");
        this.client.user.setActivity({
            type: "PLAYING",
            name: "your sound files",
        });

        log.info(`Ready. Logged in as ${this.client.user.tag}`);
    }

    async loadCommands(commands_path: string): Promise<void> {
        log.info("Installing Commands...");

        const timer = nanoTimer();

        const files = await walk(commands_path)
            .then(files => files.filter(file => path.extname(file) === ".ts" || path.extname(file) === ".js"));

        const install_opts: CmdInstallerArgs = {
            client: this.client,
            stats_collector: this.stats_collector,
        };

        await Promise.all(files.map(async file => {
            const relatve_path = path.relative(path.resolve(__dirname, ".."), file);

            log.debug("installing...: %s", relatve_path);

            const time = nanoTimer();

            const install = require(file) as CmdInstallerFile;
            if (typeof install.install === "function") {
                await install.install(install_opts);
            }

            log.debug("installed    : %s %s ms", relatve_path, nanoTimer.diffMs(time).toFixed(3));
        }));

        const install_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_SEC;

        log.info(`Commands installed. files:${files.length} commands:${InteractionRegistry.commands.size} install_time:${install_time.toFixed(3)}s`);
    }

    async deployCommands(): Promise<void> {
        const global_commands = InteractionRegistry.commands.filter(command => command.target.global);
        const guild_commands = InteractionRegistry.commands.filter(command => !command.target.global);

        if (this.client.application.partial) await this.client.application.fetch();

        // DEPLOY GLOBAL
        const global_commands_data = global_commands.map(command => command.toJSON());

        await this.client.application.commands.set(global_commands_data);

        // DEPLOY GUILDS
        const deployToGuild = async (guild: Discord.Guild) => {
            const guild_commands_data = guild_commands
                // filter out owner commands in guilds that don't need them
                .filter(command => !command.target.guild_ids || command.target.guild_ids.includes(guild.id))
                .map(command => command.toJSON());

            const app_commands = await guild.commands.set(guild_commands_data);

            for (const [, app_command] of app_commands) {
                const command = guild_commands.get(app_command.name);
                if (command) {
                    command.app_command = app_command;
                    if (typeof command.onGuildCreate === "function") {
                        await command.onGuildCreate(app_command, guild);
                    }
                }
            }
        };

        for (const [, guild] of this.client.guilds.cache) {
            await deployToGuild(guild);
        }

        this.client.on("guildCreate", async guild => {
            try {
                await deployToGuild(guild);

                const guessed_role = guessModRole(guild);

                const config = await GuildConfigManager.findOrGenConfig(guild);
                if (config && config.adminRoleId === guessed_role.id) return;

                // reset admin role to the highest role when rejoining
                // default to the highest role or a role that says "mod", "moderator"
                // or "admin" in the server (server with no roles this will be @everyone)
                await GuildConfigManager.setAdminRole(guild.id, guessed_role.id);
            } catch (error) {
                log.error({ error: logErr(error) });
            }
        });
    }

    attachListeners(): void {
        this.client.on("interactionCreate", async interaction => {
            if (await collectionBlacklistUser().findOne({ userId: interaction.user.id })) {
                if (!interaction.isCommand() && !interaction.isButton()) return;

                return await interaction.reply(replyEmbedEphemeral("You're blacklisted from using this bot anywhere.", EmbedType.Error));
            }

            if (interaction.isCommand()) {
                try {
                    const command = InteractionRegistry.commands.get(interaction.commandName);
                    if (!command) return await interaction.reply(replyEmbedEphemeral("This command doesn't exist anymore or some other thing screwed up.", EmbedType.Error));

                    log.debug("Command '%s' by '%s' (%s) in %s (%s)", command.name, interaction.user.tag, interaction.user.id, interaction.channelId, interaction.channel?.type);

                    await command.run(interaction);

                    this.stats_collector.incCalledCommands(interaction.commandName, 1);
                } catch (error) {
                    log.error({ error: logErr(error) });

                    try {
                        const reply = interaction.replied
                            ? interaction.followUp
                            : interaction.reply;
                        await reply(replyEmbedEphemeral("Some error happened.", EmbedType.Error));
                    } catch (error) {
                        log.error({ error: logErr(error) });
                    }
                }
                return;
            }

            if (interaction.isButton()) {
                const customId = interaction.customId;
                const decoded = InteractionRegistry.decodeButtonId(customId);
                // building a fallback to the old version so servers don't have to adapt so quickly
                // remove this by, like, September 1st to 8th
                if (customId.startsWith("sample.custom.")) {
                    decoded.t = BUTTON_TYPES.PLAY_CUSTOM;
                    decoded.id = customId.substring("sample.custom.".length);
                }
                if (customId.startsWith("sample.predef.")) {
                    decoded.t = BUTTON_TYPES.PLAY_STANDA;
                    decoded.n = customId.substring("sample.predef.".length);
                }

                for (const button_handler of InteractionRegistry.buttons) {
                    try {
                        if (!InteractionRegistry.checkButtonFilter(decoded, button_handler.filter)) continue;

                        log.debug("Button '%i' by '%s' (%s) in %s (%s)", decoded.t, interaction.user.tag, interaction.user.id, interaction.channelId, interaction.channel?.type);

                        const result = await button_handler.func(interaction, decoded);

                        this.stats_collector.incCalledButtons(decoded.t, 1);

                        if (!result || interaction.replied) continue;

                        await interaction.reply(result);
                    } catch (error) {
                        log.error({ error: logErr(error) });
                    }
                }
            }
        });

        // handle leaving voice channels when users go somewhere else
        this.client.on("voiceStateUpdate", (old_state, new_state) => {
            const subscription = AudioManager.get(new_state.guild.id);
            // if we don't know of such a voice connection, let it stop
            if (!subscription) return;

            if (old_state.id === this.client.user.id) {
                // if bot has disconnected or was kicked from a voice channel
                if (old_state.channelId && !new_state.channelId) {
                    return subscription.destroy();
                }
            } else if (!old_state.channelId) { // if wasn't in a voice channel to begin with, stop
                return;
            }

            const channel = new_state.guild.me?.voice.channel;
            if (!channel) return;

            if (channel.members.filter(m => !m.user.bot).size > 0) return;

            return subscription.destroy();
        });
    }

    static async create(client: Discord.Client<true>): Promise<Core> {
        const core = new Core(client);

        await core.setup();

        return core;
    }
}
