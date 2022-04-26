import { APIApplicationCommandMentionableOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createMentionableOption(opts: Omit<APIApplicationCommandMentionableOption, "type">): BaseOptionData<APIApplicationCommandMentionableOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.Mentionable,
        ...opts,
    });
}
