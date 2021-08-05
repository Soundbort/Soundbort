import Discord, { Awaited } from "discord.js";
import { fetchMember } from "../util/util";
import { collectionConfig } from "../modules/database/models";
import { ConfigSchema } from "../modules/database/schemas/ConfigSchema";

type OnAdminRoleChangeFunc = (guildId: Discord.Snowflake, roleId: Discord.Snowflake) => Awaited<void>;

class GuildConfigManager {
    private on_admin_role_change_handlers: OnAdminRoleChangeFunc[] = [];

    public async findConfig(guildId: Discord.Snowflake): Promise<ConfigSchema | undefined> {
        const doc = await collectionConfig().findOne({ guildId: guildId });
        if (!doc) return;

        return doc;
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

        // if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;

        const config = await this.findConfig(guild.id);
        if (!config) return false;
        if (!config.adminRoleId) return false;
        if (member.roles.cache.has(config.adminRoleId)) return true;

        return false;
    }
}

export default new GuildConfigManager();
