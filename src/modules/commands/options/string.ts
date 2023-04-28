import * as Discord from "discord.js";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared.js";

export function createStringOption(
    opts: WithAutocompleteOrChoice<Omit<Discord.APIApplicationCommandStringOption, "type">, string>,
): WithAutocompleteOrChoicesOptionData<Discord.APIApplicationCommandStringOption, string> {
    return {
        type: Discord.ApplicationCommandOptionType.String,
        data: {
            type: Discord.ApplicationCommandOptionType.String,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
