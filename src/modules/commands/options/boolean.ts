import { APIApplicationCommandBooleanOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createBooleanOption(opts: Omit<APIApplicationCommandBooleanOption, "type">): BaseOptionData<APIApplicationCommandBooleanOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.Boolean,
        ...opts,
    });
}
