import Discord from "discord.js";
import { ApplicationCommandOptionChoice } from "./createChoice";

function createOption(
    type: Discord.ApplicationCommandOptionType,
    name: string,
    description: string,
    required: boolean,
    choices?: Discord.ApplicationCommandOptionChoice[],
): Discord.ApplicationCommandOptionData {
    return {
        type,
        name,
        description,
        required,
        choices,
    };
}

export function createStringOption(
    name: string, description: string, required: boolean = true, choices?: ApplicationCommandOptionChoice<string>[],
): Discord.ApplicationCommandOptionData {
    return createOption("STRING", name, description, required, choices);
}
export function createIntegerOption(
    name: string, description: string, required: boolean = true, choices?: ApplicationCommandOptionChoice<number>[],
): Discord.ApplicationCommandOptionData {
    return createOption("INTEGER", name, description, required, choices);
}
export function createBooleanOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOptionData {
    return createOption("BOOLEAN", name, description, required);
}
export function createUserOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOptionData {
    return createOption("USER", name, description, required);
}
export function createChannelOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOptionData {
    return createOption("CHANNEL", name, description, required);
}
export function createRoleOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOptionData {
    return createOption("ROLE", name, description, required);
}
export function createMentionableOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOptionData {
    return createOption("MENTIONABLE", name, description, required);
}
