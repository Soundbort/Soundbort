import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared.js";

export function createMentionableOption(
    opts: Omit<Discord.APIApplicationCommandMentionableOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandMentionableOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.Mentionable,
        ...opts,
    });
}
