import * as Discord from "discord.js";

import Logger from "../../log";
import DiscordPermissionsV2Utils from "../../util/discord-patch/DiscordPermissionsV2Utils";
import InteractionRegistry from "../InteractionRegistry";
import { CustomSample } from "../soundboard/CustomSample";
import { StandardSample } from "../soundboard/StandardSample";

const log = Logger.child({ label: "AdminPermissions" });

export default class AdminPermissions {
    public client: Discord.Client<true>;
    public registry: InteractionRegistry;
    public discord: DiscordPermissionsV2Utils;

    constructor(client: Discord.Client<true>, registry: InteractionRegistry) {
        this.client = client;
        this.registry = registry;
        this.discord = DiscordPermissionsV2Utils.client(client);
    }

    public async isAdmin(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const config_api_command = this.registry.getAPICommand(guild.id, "config");
        if (!config_api_command) {
            log.error("Command couldn't be found in registry", { guildId: guild.id, commandName: "config" });
            return false;
        }

        const admin_permissions = await this.discord.canUseCommand(config_api_command, guild, null, userId);

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
