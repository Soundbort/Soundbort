import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared.js";

export function createRoleOption(
    opts: Omit<Discord.APIApplicationCommandRoleOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandRoleOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.Role,
        ...opts,
    });
}
