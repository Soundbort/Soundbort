import Discord from "discord.js";
import Cache from "../modules/Cache";
import { fetchMember } from "../util/util";
import { collectionConfig } from "../modules/database/models";
import { ConfigSchema } from "../modules/database/schemas/ConfigSchema";

class GuildConfigManager {
    private cache = new Cache<string, ConfigSchema>();

    public async findConfig(guildId: Discord.Snowflake): Promise<ConfigSchema | undefined> {
        if (this.cache.has(guildId)) return this.cache.get(guildId);

        const doc = await collectionConfig().findOne({ guildId: guildId });
        if (!doc) return;

        this.cache.set(guildId, doc);

        return doc;
    }

    public async setAdminRole(guildId: Discord.Snowflake, roleId: Discord.Snowflake): Promise<void> {
        const doc = await collectionConfig()
            .findOneAndUpdate(
                { guildId },
                { $set: { adminRoleId: roleId } },
                { fullResponse: true, upsert: true },
            );
        if (!doc.value) return;

        this.cache.set(guildId, doc.value);
    }

    public async isModerator(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const member = await fetchMember(guild, userId);
        if (!member) return false;

        if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;

        const config = await this.findConfig(guild.id);
        if (!config) return false;
        if (!config.adminRoleId) return false;
        if (member.roles.cache.has(config.adminRoleId)) return true;

        return false;
    }
}

export default new GuildConfigManager();
