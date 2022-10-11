import * as Discord from "discord.js";
import qs from "query-string";

import Logger from "../log";
import { BUTTON_TYPES } from "../const";
import { doNothing } from "../util/util";
import { removeDupes } from "../util/array";

import DiscordPermissionsV2Utils from "../util/discord-patch/DiscordPermissionsV2Utils";
import { SimpleFuncReturn } from "../modules/commands/AbstractSharedCommand";
import { SlashCommand } from "../modules/commands/SlashCommand";

export type ButtonFilter = Record<string, string>;
export type ButtonParsed = qs.ParsedQuery<string> & { t: BUTTON_TYPES };

export type ButtonHandler = (interaction: Discord.ButtonInteraction, decoded: ButtonParsed) => (Promise<SimpleFuncReturn> | SimpleFuncReturn);

const log = Logger.child({ label: "Core => InteractionRegistry" });

export default class InteractionRegistry {
    public commands = new Discord.Collection<string, SlashCommand>();
    public buttons: { filter: ButtonFilter; func: ButtonHandler }[] = [];

    public global_api_commands = new Map<string, Discord.APIApplicationCommand>();
    public guild_api_commands = new Map<Discord.Snowflake, Map<string, Discord.APIApplicationCommand>>();

    public addCommand(command: SlashCommand): void {
        if (this.commands.has(command.data.name)) throw new Error("Command name already exists");

        this.commands.set(command.data.name, command);
    }

    private async deployToGuild(perms_utils: DiscordPermissionsV2Utils, guild: Discord.Guild, guild_commands: Discord.Collection<string, SlashCommand>) {
        const guild_commands_data = guild_commands
            // filter out owner commands in guilds that don't need them
            .filter(command => command.exclusive_guild_ids.includes(guild.id))
            .map(command => command.data);

        const guild_app_commands = await perms_utils.setApplicationGuildCommands(guild.id, guild_commands_data);

        for (const app_command of guild_app_commands) {
            let api_commands = this.guild_api_commands.get(guild.id);
            if (!api_commands) {
                this.guild_api_commands.set(guild.id, api_commands = new Map());
            }
            api_commands.set(app_command.name, app_command);

            const command = guild_commands.get(app_command.name);
            if (command && typeof command.onGuildCreate === "function") {
                await command.onGuildCreate(guild);
            }
        }
    }

    private async clearGuilds(perms_utils: DiscordPermissionsV2Utils, guilds: Discord.Guild[]) {
        for (const guild of guilds) {
            try {
                await perms_utils.setApplicationGuildCommands(guild.id, []);
            } catch (error) {
                log.error("Deploying to guild %s failed.", guild.id, error);
            }
        }
        log.info("Orphan Guild Commands cleared.");
    }

    public async deployCommands(client: Discord.Client<true>): Promise<void> {
        const perms_utils = DiscordPermissionsV2Utils.client(client);

        // ///////// DEPLOY COMMANDS /////////

        log.info("Deploying Global Commands...");

        const global_commands = this.commands.filter(command => command.exclusive_guild_ids.length === 0);
        const global_commands_data = global_commands.map(command => command.data);

        const global_app_commands = await perms_utils.setApplicationCommands(global_commands_data);
        for (const app_command of global_app_commands) {
            this.global_api_commands.set(app_command.name, app_command);
        }

        // ///////// DEPLOY EXCLUSIVE GUILD COMMANDS /////////

        log.info("Deploying Exclusive Guild Commands...");

        const guild_commands = this.commands.filter(command => command.exclusive_guild_ids.length > 0);

        client.on("guildCreate", async guild => {
            try {
                await this.deployToGuild(perms_utils, guild, guild_commands);
            } catch (error) {
                log.error("Deploying to guild %s failed.", guild.id, error);
            }
        });

        log.info("Clearing Orphan Guild Commands...");

        // merge all exclusive guild ids together, to have an array of all guilds
        // that need to be deployed to.
        // this allows us to deploy to these guilds first thing in the morning
        // and then asynchronously remove orphan commands from all other guilds later
        const guild_ids = removeDupes(guild_commands.reduce((c, a) => [...c, ...a.exclusive_guild_ids], [] as string[]));
        const guilds = guild_ids.map(guild_id => client.guilds.cache.get(guild_id)).filter(Boolean) as Discord.Guild[];

        for (const guild of guilds) {
            try {
                await this.deployToGuild(perms_utils, guild, guild_commands);
            } catch (error) {
                log.error("Deploying to guild %s failed.", guild.id, error);
            }
        }

        // asynchronously remove orphan guild commands from all guilds that
        // do not have exclusive commands anymore
        const clearable_guilds = [...client.guilds.cache.values()].filter(guild => !guild_ids.includes(guild.id));
        this.clearGuilds(perms_utils, clearable_guilds).catch(doNothing);

        log.info("All Commands deployed.");
    }

    public getAPICommand(guild_id: Discord.Snowflake, command_name: string) {
        return this.guild_api_commands.get(guild_id)?.get(command_name) ?? this.global_api_commands.get(command_name);
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
