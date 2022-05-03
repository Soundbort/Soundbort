import path from "node:path";
import * as Discord from "discord.js";

import nanoTimer from "../util/timer";
import { timeout } from "../util/promises";
import Logger from "../log";
import { walk } from "../util/files";
import { CmdInstallerArgs, CmdInstallerFile } from "../util/types";

import InteractionRegistry from "./InteractionRegistry";
import { SlashCommand } from "../modules/commands/SlashCommand";

const log = Logger.child({ label: "Core => InteractionLoader" });

export async function installCommands(client: Discord.Client<true>): Promise<void> {
    log.info("Installing Commands...");

    const timer = nanoTimer();

    const commands_path = path.join(__dirname, "..", "commands");

    const files = await walk(commands_path)
        .then(files => files.filter(file => /\.(ts|js)$/.test(file)));

    const install_opts: CmdInstallerArgs = {
        client: client,
    };

    await Promise.all(files.map(async file => {
        const relative_path = path.relative(path.join(__dirname, ".."), file);

        const time = nanoTimer();

        try {
            const install = await import(file) as CmdInstallerFile;
            if (typeof install.install === "function") await install.install(install_opts);
        } catch (error) {
            log.error("failed       : %s", relative_path);
            throw error;
        }

        log.debug("installed    : %s %s ms", relative_path, nanoTimer.diffMs(time).toFixed(3));
    }));

    const install_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_SEC;

    log.info(`Commands installed. files:${files.length} commands:${InteractionRegistry.commands.size} install_time:${install_time.toFixed(3)}s`);
}

// DEPLOYING

async function deployToGuild(guild_commands: Discord.Collection<string, SlashCommand>, guild: Discord.Guild) {
    const guild_commands_data = guild_commands
        // filter out owner commands in guilds that don't need them
        .filter(command => command.exclusive_guild_ids.includes(guild.id))
        .map(command => command.data);

    // same thing as with global commands up-top
    await guild.commands.set(guild_commands_data as any[]);

    for (const [, command] of guild_commands) {
        if (typeof command.onGuildCreate === "function") {
            await command.onGuildCreate(guild);
        }
    }
}

export async function deployCommands(client: Discord.Client<true>): Promise<void> {
    log.info("Deploying Commands...");

    if (client.application.partial) await client.application.fetch();

    // DEPLOY GLOBAL
    const global_commands = InteractionRegistry.commands.filter(command => command.exclusive_guild_ids.length === 0);
    const global_commands_data = global_commands.map(command => command.data);

    // global_commands_data is actually RESTPostAPIApplicationCommandsJSONBody[]!! but
    // discord.js types will hint an error, because it depends on an older version of
    // discord-api-types
    // therefore need to cast it as any
    await client.application.commands.set(global_commands_data as any[]);

    const guild_commands = InteractionRegistry.commands.filter(command => command.exclusive_guild_ids.length > 0);

    client.on("guildCreate", async guild => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                await deployToGuild(guild_commands, guild);
                break;
            } catch (error) {
                log.error("Deploying to guild %s failed. Retrying later", guild.id, error);

                // retry guild that couldn't be deployed after 15 minutes
                await timeout(15 * 60_000);
            }
        }
    });

    const undeployed_guilds = client.guilds.cache.clone();

    while (undeployed_guilds.size > 0) {
        for (const [, guild] of client.guilds.cache) {
            try {
                await deployToGuild(guild_commands, guild);
                undeployed_guilds.delete(guild.id);
            } catch (error) {
                log.error("Deploying to guild %s failed. Retrying later", guild.id, error);
            }
        }

        log.info("Guild commands deployed. %d left for retrying.", undeployed_guilds.size);

        // retry guilds that couldn't be deployed after 15 minutes
        await timeout(15 * 60_000);
    }

    log.info("All Commands deployed.");
}
