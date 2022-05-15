import * as Discord from "discord.js";
import { TypedEmitter } from "tiny-typed-emitter";
import { MatchKeysAndValues } from "mongodb";

import * as models from "../../modules/database/models";
import { GuildConfigSchema } from "../../modules/database/schemas/GuildConfigSchema";

interface GuildConfigManagerEvents {
    change(guildId: Discord.Snowflake, config: GuildConfigSchema): void;
}

class GuildConfigManager extends TypedEmitter<GuildConfigManagerEvents> {
    static DEFAULTS = {};

    public async removeConfig(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_config.deleteOne({ guildId });
    }

    public async setConfig(guildId: Discord.Snowflake, config: GuildConfigSchema): Promise<void> {
        await models.guild_config.replaceOne({ guildId }, config, { upsert: true });
    }

    public async updateConfig(guildId: Discord.Snowflake, partial_config: MatchKeysAndValues<GuildConfigSchema>): Promise<void> {
        await models.guild_config.updateOne({ guildId }, { $set: partial_config });
    }

    /**
     * Get an existing config from the database, check it's values and repair it, or create a new config if it doesn't exist
     */
    public async findOrGenConfig(guildId: Discord.Snowflake): Promise<GuildConfigSchema> {
        const doc = await models.guild_config.findOne({ guildId });

        if (!doc) {
            const config: GuildConfigSchema = { ...GuildConfigManager.DEFAULTS, guildId };
            await this.setConfig(config.guildId, config);
            return config;
        }

        return doc;
    }

    // public async setValue(guildId: Discord.Snowflake, value: any): Promise<void> {
    //     await this.updateConfig(guildId, { value });
    //
    //     this.emit("change", guildId, await this.findOrGenConfig(guildId));
    //     this.emit("valueChange", guildId, value);
    // }
}

export default new GuildConfigManager();
