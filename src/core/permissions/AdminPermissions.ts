import * as Discord from "discord.js";

import Logger from "../../log.js";
import { canUseCommand } from "../../util/permissions.js";
import InteractionRegistry from "../InteractionRegistry.js";
import { CustomSample } from "../soundboard/CustomSample.js";
import { StandardSample } from "../soundboard/StandardSample.js";

const log = Logger.child({ label: "AdminPermissions" });

export default class AdminPermissions {
    public client: Discord.Client<true>;
    public registry: InteractionRegistry;

    constructor(client: Discord.Client<true>, registry: InteractionRegistry) {
        this.client = client;
        this.registry = registry;
    }

    public async isAdmin(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const config_command = this.registry.getApplicationCommand(guild.id, "config");
        if (!config_command) {
            log.error("Command couldn't be found in registry", { guildId: guild.id, commandName: "config" });
            return false;
        }

        const admin_permissions = await canUseCommand(config_command, guild, null, userId);

        return admin_permissions.user;
    }

    public async canDeleteSample(sample: CustomSample | StandardSample, userId: string, guild: Discord.Guild | null) {
        if (sample instanceof CustomSample) {
            // has sample in user soundboard?
            if (sample.isInUsers(userId)) return true;
            // ok then not, but has sample in server soundboard?
            else if (
                guild
                && sample.isInGuilds(guild.id)
                // is an admin? can remove sample?
                && await this.isAdmin(guild, userId)
            ) return true;
        }
        return false;
    }
}
