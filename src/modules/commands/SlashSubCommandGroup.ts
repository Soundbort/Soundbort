import { APIApplicationCommandSubcommandGroupOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import * as Discord from "discord.js";

import { SharedCommandOptions, MiddlewareFunc } from "./AbstractSharedCommand";
import { SlashSubCommand } from "./SlashSubCommand";

export interface SlashSubCommandGroupOptions extends SharedCommandOptions {
    commands: SlashSubCommand[];
    middleware?: MiddlewareFunc;
}

export class SlashSubCommandGroup {
    readonly data: APIApplicationCommandSubcommandGroupOption;

    readonly middleware?: MiddlewareFunc;
    readonly commands: Map<string, SlashSubCommand> = new Map();

    constructor(options: SlashSubCommandGroupOptions) {
        this.middleware = options.middleware;

        this.data = {
            type: ApplicationCommandOptionType.SubcommandGroup,

            name: options.name,
            name_localizations: options.name_localizations,
            description: options.description,
            description_localizations: options.description_localizations,

            options: options.commands.map(command => command.data),
        };

        for (const command of options.commands) {
            if (this.commands.has(command.data.name)) throw new Error("Command name already exists");

            this.commands.set(command.data.name, command);
        }
    }

    protected _getSubcommand(interaction: Discord.CommandInteraction | Discord.AutocompleteInteraction): SlashSubCommand | undefined {
        const command_name = interaction.options.getSubcommand(true);
        return this.commands.get(command_name);
    }

    async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.autocomplete(interaction);
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (this.middleware && !await this.middleware(interaction)) return;

        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.run(interaction);
    }
}
