import { APIApplicationCommandAttachmentOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createAttachmentOption(opts: Omit<APIApplicationCommandAttachmentOption, "type">): BaseOptionData<APIApplicationCommandAttachmentOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.Attachment,
        ...opts,
    });
}
