import { ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";
import * as Discord from "discord.js";

import { SharedCommandOptions, MiddlewareFunc, SimpleFunc } from "./AbstractSharedCommand";
import { SlashCommandAutocompleteMixin } from "./mixins/SlashCommandAutocompleteMixin";
import { CommandOptionData } from "./options";
import { SlashSubCommand } from "./SlashSubCommand";
import { SlashSubCommandGroup } from "./SlashSubCommandGroup";

export interface CommandTarget {
    global: boolean;
    guildHidden: boolean;
    guild_ids?: Discord.Snowflake[];
}

export type GuildCreateEventHandler = (
    app_command: Discord.ApplicationCommand,
    // setPermissions: (permissions: APIApplicationCommandPermission[]) => Promise<RESTPutAPIGuildApplicationCommandsPermissionsJSONBody>,
    guild: Discord.Guild,
) => Discord.Awaitable<void>;

export interface SlashBaseCommandOptions extends SharedCommandOptions {
    target?: CommandTarget;
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
    readonly data: Readonly<RESTPostAPIChatInputApplicationCommandsJSONBody>;

    readonly func?: SimpleFunc;
    readonly middleware?: MiddlewareFunc;
    readonly onGuildCreate?: GuildCreateEventHandler;
    readonly target: CommandTarget;
    readonly options: Map<string, CommandOptionData> = new Map();
    readonly commands: Map<string, SlashSubCommand | SlashSubCommandGroup> = new Map();

    get is_group_command() {
        // If at least one subcommand exists, this is a group
        // command, if none exists, it's a normal command
        return this.commands.size > 0;
    }

    constructor(options: SlashCommandOptions) {
        super();

        this.target = options.target ?? { global: false, guildHidden: false };

        this.onGuildCreate = options.onGuildCreate;

        this.data = {
            type: ApplicationCommandType.ChatInput,

            name: options.name,
            name_localizations: options.name_localizations,
            description: options.description,
            description_localizations: options.description_localizations,
            default_permission: !(this.target.guildHidden),

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

    protected _getSubcommand(interaction: Discord.CommandInteraction | Discord.AutocompleteInteraction): SlashSubCommand | SlashSubCommandGroup | undefined {
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

    private async runGroupCommand(interaction: Discord.CommandInteraction) {
        if (this.middleware && !await this.middleware(interaction)) return;

        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.run(interaction);
    }
    private async runSingleCommand(interaction: Discord.CommandInteraction) {
        const result = await this.func?.(interaction); // Optional chaining (?.), the function will only be called if this.func property is not nullish
        if (!result || interaction.replied) return;

        await (interaction.deferred ? interaction.editReply(result) : interaction.reply(result));
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (this.is_group_command) {
            await this.runGroupCommand(interaction);
        } else {
            await this.runSingleCommand(interaction);
        }
    }
}
