import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared.js";

export function createBooleanOption(
    opts: Omit<Discord.APIApplicationCommandBooleanOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandBooleanOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.Boolean,
        ...opts,
    });
}
