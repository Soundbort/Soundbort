import { APIApplicationCommandIntegerOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared";

export function createIntegerOption(
    opts: WithAutocompleteOrChoice<Omit<APIApplicationCommandIntegerOption, "type">, number>,
): WithAutocompleteOrChoicesOptionData<APIApplicationCommandIntegerOption, number> {
    return {
        type: ApplicationCommandOptionType.Integer,
        data: {
            type: ApplicationCommandOptionType.Integer,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
