import Discord, { Awaited } from "discord.js";
import { fetchMember, guessModRole } from "../util/util";
import { collectionConfig } from "../modules/database/models";
import { ConfigSchema } from "../modules/database/schemas/ConfigSchema";

type OnAdminRoleChangeFunc = (guildId: Discord.Snowflake, roleId: Discord.Snowflake) => Awaited<void>;

class GuildConfigManager {
    private on_admin_role_change_handlers: OnAdminRoleChangeFunc[] = [];

    public async setConfig(guildId: Discord.Snowflake, config: ConfigSchema): Promise<void> {
        await collectionConfig().replaceOne({ guildId }, config, { upsert: true });
    }

    /**
     * Get an existing config from the database, check it's values and repair it, or create a new config if it doesn't exist
     */
    public async findOrGenConfig(guild: Discord.Guild): Promise<ConfigSchema> {
        // eslint-disable-next-line prefer-const
        let { guildId, adminRoleId } = await collectionConfig().findOne({ guildId: guild.id }) || { guildId: guild.id };
        let data_changed = false;

        // if old admin role has been deleted, default back to the guessed role
        if (!adminRoleId || !await guild.roles.fetch(adminRoleId)) {
            const guessed_role = guessModRole(guild);
            adminRoleId = guessed_role.id;
            data_changed = true;
        }

        const config: ConfigSchema = { guildId, adminRoleId };

        if (data_changed) {
            await this.setConfig(guildId, config);
        }

        return config;
    }

    public async setAdminRole(guildId: Discord.Snowflake, roleId: Discord.Snowflake): Promise<void> {
        await this.setConfig(guildId, { guildId, adminRoleId: roleId });

        for (const handler of this.on_admin_role_change_handlers) await handler(guildId, roleId);
    }

    public onAdminRoleChange(func: OnAdminRoleChangeFunc): void {
        this.on_admin_role_change_handlers.push(func);
    }

    public async isModerator(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const member = await fetchMember(guild, userId);
        if (!member) return false;

        const config = await this.findOrGenConfig(guild);
        if (!config) return false;

        if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;

        if (member.roles.cache.has(config.adminRoleId)) return true;

        return false;
    }
}

export default new GuildConfigManager();
