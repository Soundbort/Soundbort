import Discord from "discord.js";

export interface ApplicationCommandOptionChoice<T extends string | number> extends Discord.ApplicationCommandOptionChoice {
    name: string;
    value: T;
}

export function createChoice<T extends string | number>(name: string, value: T): ApplicationCommandOptionChoice<T> {
    return { name, value };
}
