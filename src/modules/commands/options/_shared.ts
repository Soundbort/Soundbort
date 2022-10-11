import * as Discord from "discord.js";
import { Merge } from "type-fest";

import { ApplicationCommandOptionChoice, ChoiceTypes } from "../choice";

export type CommandOptionAutocompleteFunc<T = any> = (value: T, interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<ApplicationCommandOptionChoice[]>;

export type WithAutocompleteOrChoice<Base, ChoiceType extends ChoiceTypes> =
    | Merge<Base, { autocomplete?: CommandOptionAutocompleteFunc<ChoiceType>; choices?: undefined }>
    | Merge<Base, { autocomplete?: undefined; choices: Discord.APIApplicationCommandOptionChoice<ChoiceType>[]; }>;

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
