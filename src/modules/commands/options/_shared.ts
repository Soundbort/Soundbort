import * as Discord from "discord.js";
import { Merge } from "type-fest";

import { ApplicationCommandOptionChoice, ChoiceTypes } from "../choice/index.js";

export type CommandOptionAutocompleteFunc<T = any> = (value: T, interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<ApplicationCommandOptionChoice[]>;

export type WithAutocompleteOrChoice<Base, ChoiceType extends ChoiceTypes> =
    | Merge<Base, { autocomplete?: CommandOptionAutocompleteFunc<ChoiceType> }>
    | Merge<Omit<Base, "autocomplete">, { choices: Discord.APIApplicationCommandOptionChoice<ChoiceType>[]; autocomplete?: undefined }>;

export interface HasTypeField {
    type: Discord.ApplicationCommandOptionType;
}

export interface BaseOptionData<Data extends HasTypeField> {
    type: Data["type"];
    data: Data;
    autocomplete?: undefined;
}
export type WithAutocompleteOrChoicesOptionData<Data extends HasTypeField, ChoiceType extends ChoiceTypes> =
    Merge<BaseOptionData<Data>, {
        autocomplete?: CommandOptionAutocompleteFunc<ChoiceType>;
    }>;

export function createBaseOptionData<Data extends Discord.APIApplicationCommandBasicOption>(data: Data): BaseOptionData<Data> {
    return { type: data.type, data };
}
