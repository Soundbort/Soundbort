import Discord from "discord.js";
import { fetchMember, guessModRole } from "../../util/util.js";
import * as models from "../../modules/database/models.js";
import { ConfigSchema } from "../../modules/database/schemas/ConfigSchema.js";
import { GenericListener, TypedEventEmitter } from "../../util/emitter.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type EventMap = {
    adminRoleChange: GenericListener<[guildId: Discord.Snowflake, roleId: Discord.Snowflake]>;
};

class GuildConfigManager extends TypedEventEmitter<EventMap> {
    public async setConfig(guildId: Discord.Snowflake, config: ConfigSchema): Promise<void> {
        await models.config.replaceOne({ guildId }, config, { upsert: true });
    }

    public async regenConfig(guild: Discord.Guild): Promise<void> {
        const guessed_role = guessModRole(guild);

        const config = await this.findOrGenConfig(guild);
        if (config && config.adminRoleId === guessed_role.id) return;

        // reset admin role to the highest role when rejoining
        // default to the highest role or a role that says "mod", "moderator"
        // or "admin" in the server (server with no roles this will be @everyone)
        await this.setAdminRole(guild.id, guessed_role.id);
    }

    /**
     * Get an existing config from the database, check it's values and repair it, or create a new config if it doesn't exist
     */
    public async findOrGenConfig(guild: Discord.Guild): Promise<ConfigSchema> {
        // eslint-disable-next-line prefer-const
        let { guildId, adminRoleId } = await models.config.findOne({ guildId: guild.id }) || { guildId: guild.id };
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

        this.emit("adminRoleChange", guildId, roleId);
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
