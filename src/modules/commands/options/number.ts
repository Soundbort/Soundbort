import { APIApplicationCommandNumberOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared";

export function createNumberOption(
    opts: WithAutocompleteOrChoice<Omit<APIApplicationCommandNumberOption, "type">, number>,
): WithAutocompleteOrChoicesOptionData<APIApplicationCommandNumberOption, number> {
    return {
        type: ApplicationCommandOptionType.Number,
        data: {
            type: ApplicationCommandOptionType.Number,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
