import { APIApplicationCommandRoleOption, ApplicationCommandOptionType } from "discord-api-types/v10";
import { BaseOptionData, createBaseOptionData } from "./_shared";

export function createRoleOption(opts: Omit<APIApplicationCommandRoleOption, "type">): BaseOptionData<APIApplicationCommandRoleOption> {
    return createBaseOptionData({
        type: ApplicationCommandOptionType.Role,
        ...opts,
    });
}
