import Discord from "discord.js";
import path from "path";

import nanoTimer from "../util/timer";
import Logger from "../log";
import { walk } from "../util/files";
import { CmdInstallerArgs, CmdInstallerFile } from "../util/types";
import { logErr } from "../util/util";

import InteractionRegistry from "./InteractionRegistry";
import GuildConfigManager from "./managers/GuildConfigManager";
import StatsCollectorManager from "./managers/StatsCollectorManager";

const log = Logger.child({ label: "Core => InteractionLoader" });

export async function loadCommands(client: Discord.Client<true>, stats_collector: StatsCollectorManager, commands_path: string): Promise<void> {
    log.info("Installing Commands...");

    const timer = nanoTimer();

    const files = await walk(commands_path)
        .then(files => files.filter(file => path.extname(file) === ".ts" || path.extname(file) === ".js"));

    const install_opts: CmdInstallerArgs = {
        client: client,
        stats_collector: stats_collector,
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

export async function deployCommands(client: Discord.Client<true>): Promise<void> {
    const global_commands = InteractionRegistry.commands.filter(command => command.target.global);
    const guild_commands = InteractionRegistry.commands.filter(command => !command.target.global);

    if (client.application.partial) await client.application.fetch();

    // DEPLOY GLOBAL
    const global_commands_data = global_commands.map(command => command.toJSON());

    await client.application.commands.set(global_commands_data);

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

    for (const [, guild] of client.guilds.cache) {
        try {
            await deployToGuild(guild);
        } catch (error) {
            log.error({ error: logErr(error) });
        }
    }

    client.on("guildCreate", async guild => {
        try {
            await deployToGuild(guild);

            await GuildConfigManager.regenConfig(guild);
        } catch (error) {
            log.error({ error: logErr(error) });
        }
    });
}
