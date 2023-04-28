import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared.js";

export function createUserOption(
    opts: Omit<Discord.APIApplicationCommandUserOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandUserOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.User,
        ...opts,
    });
}
