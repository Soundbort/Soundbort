import * as Discord from "discord.js";
import { TypedEmitter } from "tiny-typed-emitter";

import { fetchMember, guessModRole } from "../../util/util";
import { omitProp } from "../../util/object";

import * as models from "../../modules/database/models";
import { GuildConfigSchema } from "../../modules/database/schemas/GuildConfigSchema";

interface GuildConfigManagerEvents {
    adminRoleChange(guildId: Discord.Snowflake, adminRoleId: Discord.Snowflake): void;
    volumeChange(guildId: Discord.Snowflake, volume: number): void;
}

/*
 * Only fix a config, when it is fetched. Not when values are set, because
 * that only increases unneccessary work-load, since config will be fixed
 * when fetch anyways, so no one actually cares about the admin role being
 * correct when setting the volume
 */

class GuildConfigManager extends TypedEmitter<GuildConfigManagerEvents> {
    static DEFAULTS: Omit<GuildConfigSchema, "adminRoleId" | "guildId"> = {
        volume: 1,
    };

    private generateDefaults(guild: Discord.Guild): Omit<GuildConfigSchema, "guildId"> {
        // on insert, default to guessed mod role
        const adminRoleId = guessModRole(guild).id;

        return { ...GuildConfigManager.DEFAULTS, adminRoleId };
    }

    public async removeConfig(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_config.deleteOne({ guildId });
    }

    public async createOrRegenerateConfig(guild: Discord.Guild): Promise<GuildConfigSchema> {
        // reset admin role to the highest role when rejoining
        // default to the highest role or a role that says "mod", "moderator"
        // or "admin" in the server (server with no roles this will be @everyone)
        const $set = this.generateDefaults(guild);

        await models.guild_config.updateOne(
            { guildId: guild.id },
            { $set },
            { upsert: true },
        );

        this.emit("adminRoleChange", guild.id, $set.adminRoleId);
        this.emit("volumeChange", guild.id, $set.volume);

        return { guildId: guild.id, ...$set };
    }

    /**
     * Get an existing config from the database, check it's values and repair it, or create a new config if it doesn't exist
     */
    public async findOrGenerateConfig(guild: Discord.Guild): Promise<GuildConfigSchema> {
        const doc = await models.guild_config.findOne({ guildId: guild.id });
        if (!doc) {
            return await this.createOrRegenerateConfig(guild);
        }

        const new_doc: GuildConfigSchema = { ...doc };
        let data_changed = false;

        // if old admin role has been deleted, default back to the guessed role
        if (!await guild.roles.fetch(doc.adminRoleId)) {
            new_doc.adminRoleId = guessModRole(guild).id;
            data_changed = true;
        }
        // for old-configs
        if (typeof doc.volume === "undefined") {
            new_doc.volume = GuildConfigManager.DEFAULTS.volume;
            data_changed = true;
        }

        if (data_changed) {
            await models.guild_config.replaceOne({ guildId: guild.id }, new_doc);
        }

        return new_doc;
    }

    public async setAdminRole(guild: Discord.Guild, adminRoleId: Discord.Snowflake): Promise<void> {
        // The following types enforce that $set always includes all properties that
        // do not have default values that need to be set in a DB document for semantic correctness
        const $setOnInsert = GuildConfigManager.DEFAULTS;
        const $set: Omit<GuildConfigSchema, keyof typeof $setOnInsert | "guildId"> = {
            adminRoleId,
        };

        await models.guild_config.updateOne(
            { guildId: guild.id },
            { $set, $setOnInsert },
            { upsert: true },
        );

        this.emit("adminRoleChange", guild.id, adminRoleId);
    }

    public async setVolume(guild: Discord.Guild, volume: number): Promise<void> {
        if (volume > 1 || volume < 0) {
            throw new TypeError("volume must be in 0.0...1.0");
        }

        // The following types enforce that $set always includes all properties that
        // do not have default values that need to be set in a DB document for semantic correctness
        // do not set default volume on insert, because we want to set our own value
        const $setOnInsert = omitProp(this.generateDefaults(guild), "volume");
        const $set: Omit<GuildConfigSchema, keyof typeof $setOnInsert | "guildId"> = {
            volume,
        };

        await models.guild_config.updateOne(
            { guildId: guild.id },
            { $set, $setOnInsert },
            { upsert: true },
        );

        this.emit("volumeChange", guild.id, volume);
    }

    public async isModerator(guild: Discord.Guild, userId: Discord.Snowflake): Promise<boolean> {
        const member = await fetchMember(guild, userId);
        if (!member) return false;

        if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) return true;

        const config = await this.findOrGenerateConfig(guild);

        if (member.roles.cache.has(config.adminRoleId)) return true;

        return false;
    }
}

export default new GuildConfigManager();
