import { APIApplicationCommandBasicOption, APIApplicationCommandOptionChoice, ApplicationCommandOptionType } from "discord-api-types/v10";
import * as Discord from "discord.js";
import { Merge } from "type-fest";

import { ApplicationCommandOptionChoice, ChoiceTypes } from "../choice";

export type CommandOptionAutocompleteFunc<T = any> = (value: T, interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<ApplicationCommandOptionChoice[]>;

export type WithAutocompleteOrChoice<Base, ChoiceType extends ChoiceTypes> =
    | Merge<Base, { autocomplete?: CommandOptionAutocompleteFunc<ChoiceType>; choices?: undefined }>
    | Merge<Base, { autocomplete?: undefined; choices: APIApplicationCommandOptionChoice<ChoiceType>[]; }>;

export interface HasTypeField {
    type: ApplicationCommandOptionType;
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

export function createBaseOptionData<Data extends APIApplicationCommandBasicOption>(data: Data): BaseOptionData<Data> {
    return { type: data.type, data };
}
