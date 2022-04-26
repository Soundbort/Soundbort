import { APIApplicationCommandSubcommandOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import * as Discord from "discord.js";

import { SharedCommandOptions, SimpleFunc } from "./AbstractSharedCommand";
import { SlashCommandAutocompleteMixin } from "./mixins/SlashCommandAutocompleteMixin";
import { CommandOptionData } from "./options";

export interface SlashSubCommandOptions extends SharedCommandOptions {
    options?: CommandOptionData[];
    func: SimpleFunc;
}

export class SlashSubCommand extends SlashCommandAutocompleteMixin {
    readonly data: APIApplicationCommandSubcommandOption;

    readonly func: SimpleFunc;
    readonly options: Map<string, CommandOptionData> = new Map();

    constructor(options: SlashSubCommandOptions) {
        super();

        this.func = options.func;

        this.data = {
            type: ApplicationCommandOptionType.Subcommand,

            name: options.name,
            name_localizations: options.name_localizations,
            description: options.description,
            description_localizations: options.description_localizations,

            options: options.options?.map(option => option.data),
        };

        for (const option of options.options || []) {
            if (this.options.has(option.data.name)) throw new Error("Option name already exists");

            this.options.set(option.data.name, option);
        }
    }

    async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        await this._autocomplete(interaction);
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        const result = await this.func(interaction); // Optional chaining (?.), the function will only be called if this.func property is not nullish
        if (!result || interaction.replied) return;

        await (interaction.deferred ? interaction.editReply(result) : interaction.reply(result));
    }
}
