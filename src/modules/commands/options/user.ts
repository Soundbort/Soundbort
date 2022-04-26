import { APIApplicationCommandUserOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createUserOption(opts: Omit<APIApplicationCommandUserOption, "type">): BaseOptionData<APIApplicationCommandUserOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.User,
        ...opts,
    });
}
