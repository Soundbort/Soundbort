import * as Discord from "discord.js";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createAttachmentOption(
    opts: Omit<Discord.APIApplicationCommandAttachmentOption, "type">,
): BaseOptionData<Discord.APIApplicationCommandAttachmentOption> {
    return createBaseOptionData({
        type: Discord.ApplicationCommandOptionType.Attachment,
        ...opts,
    });
}
