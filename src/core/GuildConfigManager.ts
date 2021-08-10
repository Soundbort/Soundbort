import Discord, { Awaited } from "discord.js";
import { fetchMember, guessModRole } from "../util/util";
import { collectionConfig } from "../modules/database/models";
import { ConfigSchema } from "../modules/database/schemas/ConfigSchema";

type OnAdminRoleChangeFunc = (guildId: Discord.Snowflake, roleId: Discord.Snowflake) => Awaited<void>;

class GuildConfigManager {
    private on_admin_role_change_handlers: OnAdminRoleChangeFunc[] = [];

    public async getConfig(guild: Discord.Guild): Promise<ConfigSchema | undefined> {
        const config = await collectionConfig().findOne({ guildId: guild.id });
        if (!config) return;

        return config;
    }

    public async setAdminRole(guildId: Discord.Snowflake, roleId: Discord.Snowflake): Promise<void> {
        await collectionConfig()
            .findOneAndUpdate(
                { guildId },
                { $set: { adminRoleId: roleId } },
                { upsert: true },
            );

        for (const handler of this.on_admin_role_change_handlers) await handler(guildId, roleId);
    }

    public onAdminRoleChange(func: OnAdminRoleChangeFunc): void {
        this.on_admin_role_change_handlers.push(func);
    }

    public async isModerator(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const member = await fetchMember(guild, userId);
        if (!member) return false;

        const config = await this.getConfig(guild);
        if (!config) return false;
        if (!config.adminRoleId) return false;

        if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;

        if (member.roles.cache.has(config.adminRoleId)) return true;

        return false;
    }
}

export default new GuildConfigManager();
