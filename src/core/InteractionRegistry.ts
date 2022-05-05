import * as Discord from "discord.js";
import qs from "query-string";

import Logger from "../log";
import { BUTTON_TYPES } from "../const";

import DiscordPermissions2VUtils from "../util/discord-patch/DiscordPermissionsV2Utils";
import { SimpleFuncReturn } from "../modules/commands/AbstractSharedCommand";
import { SlashCommand } from "../modules/commands/SlashCommand";

export type ButtonFilter = Record<string, string>;
export type ButtonParsed = qs.ParsedQuery<string> & { t: BUTTON_TYPES };

export type ButtonHandler = (interaction: Discord.ButtonInteraction, decoded: ButtonParsed) => (Promise<SimpleFuncReturn> | SimpleFuncReturn);

const log = Logger.child({ label: "Core => InteractionRegistry" });

export default class InteractionRegistry {
    public commands = new Discord.Collection<string, SlashCommand>();
    public buttons: { filter: ButtonFilter; func: ButtonHandler }[] = [];

    public addCommand(command: SlashCommand): void {
        if (this.commands.has(command.data.name)) throw new Error("Command name already exists");

        this.commands.set(command.data.name, command);
    }

    private async deployToGuild(perms_utils: DiscordPermissions2VUtils, guild: Discord.Guild, guild_commands: Discord.Collection<string, SlashCommand>) {
        const guild_commands_data = guild_commands
            // filter out owner commands in guilds that don't need them
            .filter(command => command.exclusive_guild_ids.includes(guild.id))
            .map(command => command.data);

        await perms_utils.setApplicationGuildCommands(guild.id, guild_commands_data);

        for (const [, command] of guild_commands) {
            if (typeof command.onGuildCreate === "function") {
                await command.onGuildCreate(guild);
            }
        }
    }

    public async deployCommands(client: Discord.Client<true>): Promise<void> {
        const perms_utils = DiscordPermissions2VUtils.client(client);

        log.info("Deploying Commands...");

        // ///////// DEPLOY COMMANDS /////////

        const global_commands = this.commands.filter(command => command.exclusive_guild_ids.length === 0);
        const global_commands_data = global_commands.map(command => command.data);

        await perms_utils.setApplicationCommands(global_commands_data);

        // ///////// DEPLOY EXCLUSIVE GUILD COMMANDS /////////

        const guild_commands = this.commands.filter(command => command.exclusive_guild_ids.length > 0);

        client.on("guildCreate", async guild => {
            try {
                await this.deployToGuild(perms_utils, guild, guild_commands);
            } catch (error) {
                log.error("Deploying to guild %s failed.", guild.id, error);
            }
        });

        await Promise.all([...client.guilds.cache.values()].map(async guild => {
            try {
                await this.deployToGuild(perms_utils, guild, guild_commands);
            } catch (error) {
                log.error("Deploying to guild %s failed.", guild.id, error);
            }
        }));

        log.info("All Commands deployed.");
    }

    public addButton(filter: ButtonFilter, func: ButtonHandler): void {
        this.buttons.push({
            filter,
            func,
        });
    }

    static encodeButtonId(json: ButtonParsed): string {
        return qs.stringify(json, { encode: true });
    }

    static decodeButtonId(id: string): ButtonParsed {
        return qs.parse(id, { decode: true }) as ButtonParsed;
    }

    static checkButtonFilter(json: ButtonParsed, filter: ButtonFilter): boolean {
        return Object.keys(filter).every(key => filter[key] === json[key]);
    }
}
