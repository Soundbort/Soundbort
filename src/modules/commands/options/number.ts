import * as Discord from "discord.js";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared.js";

export function createNumberOption(
    opts: WithAutocompleteOrChoice<Omit<Discord.APIApplicationCommandNumberOption, "type">, number>,
): WithAutocompleteOrChoicesOptionData<Discord.APIApplicationCommandNumberOption, number> {
    return {
        type: Discord.ApplicationCommandOptionType.Number,
        data: {
            type: Discord.ApplicationCommandOptionType.Number,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
