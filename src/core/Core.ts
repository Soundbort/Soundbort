import Discord from "discord.js";
import path from "path";

import nanoTimer from "../modules/nanoTimer";
import Logger from "../log";
import { StatsCollectorManager } from "./StatsCollectorManager";
import { walk } from "../util/files";
import { CmdInstallerArgs, CmdInstallerFile } from "../util/types";
import CommandRegistry from "./CommandRegistry";
import { ENVIRONMENT, EnvironmentStages } from "../config";
import { EmbedType, replyEmbedEphemeral } from "../util/util";
import AudioManager from "./audio/AudioManager";

const log = Logger.child({ label: "Core" });

export default class Core {
    client: Discord.Client<true>;
    stats_collector: StatsCollectorManager;

    constructor(client: Discord.Client<true>) {
        this.client = client;
        this.stats_collector = new StatsCollectorManager(this.client);
    }

    async setup(): Promise<any> {
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
            .then(files => files.filter(file => path.extname(file) === ".ts"));

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

        log.info(`Commands installed. files:${files.length} commands:${CommandRegistry.commands.size} install_time:${install_time.toFixed(3)}s`);
    }

    async deployCommands(): Promise<void> {
        const global_commands = CommandRegistry.commands.filter(command => command.target.global);
        const guild_commands = CommandRegistry.commands.filter(command => !command.target.global);

        const global_commands_data = global_commands.map(command => command.toJSON());
        const guild_commands_data = guild_commands.map(command => command.toJSON());

        // if development, deploy all commands to guilds, because of global command caching
        if (ENVIRONMENT === EnvironmentStages.DEVEL) {
            guild_commands_data.push(...global_commands_data);
            global_commands_data.splice(0, global_commands_data.length);
        }

        if (this.client.application.partial) await this.client.application.fetch();

        // DEPLOY GLOBAL
        await this.client.application.commands.set(global_commands_data);

        // DEPLOY GUILDS
        for (const [, guild] of this.client.guilds.cache) {
            const app_commands = await guild.commands.set(guild_commands_data);

            for (const [, app_command] of app_commands) {
                const command = guild_commands.get(app_command.name);
                if (typeof command?.onGuildCreate === "function") {
                    await command.onGuildCreate(app_command);
                }
            }
        }
    }

    attachListeners(): void {
        this.client.on("interactionCreate", async interaction => {
            if (!interaction.isCommand()) return;

            try {
                const command = CommandRegistry.commands.get(interaction.commandName);
                if (!command) return await interaction.reply({ content: "This command doesn't exist anymore or some other thing screwed up.", ephemeral: true });

                log.debug("Command '%s' by '%s' (%s) in %s (%s)", command.name, interaction.user.tag, interaction.user.id, interaction.channelId, interaction.channel?.type);

                await command.run(interaction);

                this.stats_collector.incCalledCommands(interaction.commandName, 1);
            } catch (error) {
                log.error({ error });

                try {
                    const reply = interaction.replied
                        ? interaction.followUp
                        : interaction.reply;
                    await reply(replyEmbedEphemeral("Some error happened.", EmbedType.Error));
                } catch (error) {
                    log.error({ error });
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
