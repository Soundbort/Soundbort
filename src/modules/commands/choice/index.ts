import * as Discord from "discord.js";

export type ChoiceTypes = string | number;

export interface ApplicationCommandOptionChoice<T extends ChoiceTypes> extends Discord.ApplicationCommandOptionChoice {
    name: string;
    value: T;
}

export function createChoice<T extends ChoiceTypes>(name: string, value: T): ApplicationCommandOptionChoice<T> {
    return { name, value };
}
