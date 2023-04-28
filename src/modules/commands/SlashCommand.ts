import * as Discord from "discord.js";

import { SharedCommandOptions, MiddlewareFunc, SimpleFunc } from "./AbstractSharedCommand.js";
import { SlashCommandAutocompleteMixin } from "./mixins/SlashCommandAutocompleteMixin.js";
import { CommandOptionData } from "./options/index.js";
import { SlashCommandPermissions } from "./permission/SlashCommandPermissions.js";
import { SlashSubCommand } from "./SlashSubCommand.js";
import { SlashSubCommandGroup } from "./SlashSubCommandGroup.js";

export type GuildCreateEventHandler = (guild: Discord.Guild) => Discord.Awaitable<void>;

export interface SlashBaseCommandOptions extends SharedCommandOptions {
    permissions: SlashCommandPermissions;
    /**
     * An array of guild ids the command is exclusively available in.
     * By default every command is global unless it is exclusive to
     * specific guilds.
     */
    exclusive_guild_ids?: Discord.Snowflake[];
    onGuildCreate?: GuildCreateEventHandler;
}

export interface SlashGroupCommandOptions extends SlashBaseCommandOptions {
    commands: (SlashSubCommand | SlashSubCommandGroup)[];
    middleware?: MiddlewareFunc;
}

export interface SlashSingleCommandOptions extends SlashBaseCommandOptions {
    options?: CommandOptionData[];
    func: SimpleFunc;
}

export type SlashCommandOptions = SlashGroupCommandOptions | SlashSingleCommandOptions;

export class SlashCommand extends SlashCommandAutocompleteMixin {
    readonly data: Readonly<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody>;

    readonly exclusive_guild_ids: Discord.Snowflake[];
    readonly permissions: SlashCommandPermissions;
    readonly options: Map<string, CommandOptionData> = new Map();
    readonly commands: Map<string, SlashSubCommand | SlashSubCommandGroup> = new Map();

    readonly func?: SimpleFunc;
    readonly middleware?: MiddlewareFunc;
    readonly onGuildCreate?: GuildCreateEventHandler;

    get is_group_command() {
        // If at least one subcommand exists, this is a group
        // command, if none exists, it's a normal command
        return this.commands.size > 0;
    }

    constructor(options: SlashCommandOptions) {
        super();

        this.permissions = options.permissions;
        this.exclusive_guild_ids = options.exclusive_guild_ids ?? [];

        this.onGuildCreate = options.onGuildCreate;

        this.data = {
            type: Discord.ApplicationCommandType.ChatInput,

            name: options.name,
            name_localizations: options.name_localizations,
            description: options.description,
            description_localizations: options.description_localizations,

            default_member_permissions: options.permissions.default_member_permissions,
            dm_permission: options.permissions.dm_permission,

            options: "commands" in options
                ? options.commands.map(command => command.data)
                : options.options?.map(option => option.data),
        };

        if ("commands" in options) {
            this.middleware = options.middleware;

            for (const command of options.commands) {
                if (this.commands.has(command.data.name)) throw new Error("Command name already exists");

                this.commands.set(command.data.name, command);
            }
        } else {
            this.func = options.func;

            for (const option of options.options || []) {
                if (this.options.has(option.data.name)) throw new Error("Option name already exists");

                this.options.set(option.data.name, option);
            }
        }
    }

    protected _getSubcommand(interaction: Discord.ChatInputCommandInteraction | Discord.AutocompleteInteraction): SlashSubCommand | SlashSubCommandGroup | undefined {
        const command_name = interaction.options.getSubcommandGroup(false) || interaction.options.getSubcommand(true);
        return this.commands.get(command_name);
    }

    async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        // If its a group command, pass autocomplete down to wanted subcommand
        if (this.is_group_command) {
            const command = this._getSubcommand(interaction);
            if (!command) return;

            return await command.autocomplete(interaction);
        }

        await this._autocomplete(interaction);
    }

    private async _runGroupCommand(interaction: Discord.ChatInputCommandInteraction) {
        if (this.middleware && !await this.middleware(interaction)) return;

        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.run(interaction);
    }
    private async _runSingleCommand(interaction: Discord.ChatInputCommandInteraction) {
        const result = await this.func?.(interaction); // Optional chaining (?.), the function will only be called if this.func property is not nullish
        if (!result || interaction.replied) return;

        await (interaction.deferred ? interaction.editReply(result) : interaction.reply(result));
    }

    async run(interaction: Discord.ChatInputCommandInteraction): Promise<void> {
        if (this.is_group_command) {
            await this._runGroupCommand(interaction);
        } else {
            await this._runSingleCommand(interaction);
        }
    }
}
