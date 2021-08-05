import Discord from "discord.js";
import { ApplicationCommandOptionChoice } from "./createChoice";

function createOption(
    type: Discord.ApplicationCommandOptionType,
    name: string,
    description: string,
    required: boolean,
    choices?: Discord.ApplicationCommandOptionChoice[],
): Discord.ApplicationCommandOption {
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
): Discord.ApplicationCommandOption {
    return createOption("STRING", name, description, required, choices);
}
export function createIntegerOption(
    name: string, description: string, required: boolean = true, choices?: ApplicationCommandOptionChoice<number>[],
): Discord.ApplicationCommandOption {
    return createOption("INTEGER", name, description, required, choices);
}
export function createBooleanOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOption {
    return createOption("BOOLEAN", name, description, required);
}
export function createUserOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOption {
    return createOption("USER", name, description, required);
}
export function createChannelOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOption {
    return createOption("CHANNEL", name, description, required);
}
export function createRoleOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOption {
    return createOption("ROLE", name, description, required);
}
export function createMentionableOption(
    name: string, description: string, required: boolean = true,
): Discord.ApplicationCommandOption {
    return createOption("MENTIONABLE", name, description, required);
}
