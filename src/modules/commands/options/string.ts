import { APIApplicationCommandStringOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { WithAutocompleteOrChoice, WithAutocompleteOrChoicesOptionData } from "./_shared";

export function createStringOption(
    opts: WithAutocompleteOrChoice<Omit<APIApplicationCommandStringOption, "type">, string>,
): WithAutocompleteOrChoicesOptionData<APIApplicationCommandStringOption, string> {
    return {
        type: ApplicationCommandOptionType.String,
        data: {
            type: ApplicationCommandOptionType.String,
            ...opts,
            autocomplete: !!opts.autocomplete,
        },
        autocomplete: opts.autocomplete,
    };
}
