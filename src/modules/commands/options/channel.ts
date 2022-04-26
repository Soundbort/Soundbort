import { APIApplicationCommandChannelOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createChannelOption(opts: Omit<APIApplicationCommandChannelOption, "type">): BaseOptionData<APIApplicationCommandChannelOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.Channel,
        ...opts,
    });
}
