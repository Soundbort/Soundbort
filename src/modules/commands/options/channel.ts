import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createChannelOption(
    opts: Omit<Discord.APIApplicationCommandChannelOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandChannelOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.Channel,
        ...opts,
    });
}
