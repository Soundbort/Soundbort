import * as Discord from "discord.js";
import { TypedEmitter } from "tiny-typed-emitter";
import { MatchKeysAndValues } from "mongodb";

import * as models from "../../modules/database/models.js";
import { GuildConfigSchema } from "../../modules/database/schemas/GuildConfigSchema.js";

interface GuildConfigManagerEvents {
    change(guildId: Discord.Snowflake, config: GuildConfigSchema): void;
    allowForeignSamplesChange(guildId: Discord.Snowflake, disallowForeignSamples: boolean): void;
}

class GuildConfigManager extends TypedEmitter<GuildConfigManagerEvents> {
    static DEFAULTS: Omit<GuildConfigSchema, "guildId"> = {
        allowForeignSamples: true,
    };

    public async removeConfig(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_config.deleteOne({ guildId });
    }

    private async setConfig(guildId: Discord.Snowflake, config: GuildConfigSchema): Promise<void> {
        await models.guild_config.replaceOne(
            { guildId },
            config,
            { upsert: true },
        );
    }

    private async updateConfig(guildId: Discord.Snowflake, partial_config: MatchKeysAndValues<GuildConfigSchema>): Promise<void> {
        const $setOnInsert: Record<string, any> = { ...GuildConfigManager.DEFAULTS };
        for (const key in partial_config) {
            delete $setOnInsert[key];
        }

        await models.guild_config.updateOne(
            { guildId },
            { $set: partial_config, $setOnInsert },
            { upsert: true },
        );
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

        return {
            guildId: doc.guildId,
            allowForeignSamples: doc.allowForeignSamples ?? GuildConfigManager.DEFAULTS.allowForeignSamples,
        };
    }

    public async setAllowForeignSamples(guildId: Discord.Snowflake, allowForeignSamples: boolean): Promise<void> {
        await this.updateConfig(guildId, { allowForeignSamples });

        this.emit("change", guildId, await this.findOrGenConfig(guildId));
        this.emit("allowForeignSamplesChange", guildId, allowForeignSamples);
    }

    public async hasAllowForeignSamples(guildId: Discord.Snowflake): Promise<boolean> {
        const config = await this.findOrGenConfig(guildId);
        return config.allowForeignSamples;
    }
}

export default new GuildConfigManager();
