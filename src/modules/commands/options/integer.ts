import * as Discord from "discord.js";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared.js";

export function createIntegerOption(
    opts: WithAutocompleteOrChoice<Omit<Discord.APIApplicationCommandIntegerOption, "type">, number>,
): WithAutocompleteOrChoicesOptionData<Discord.APIApplicationCommandIntegerOption, number> {
    return {
        type: Discord.ApplicationCommandOptionType.Integer,
        data: {
            type: Discord.ApplicationCommandOptionType.Integer,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
