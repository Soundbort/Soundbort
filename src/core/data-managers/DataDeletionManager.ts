import * as Discord from "discord.js";

import * as models from "../../modules/database/models";

const TWO_WEEKS = 1000 * 3600 * 24 * 14;

class DataDeletionManager {
    public async markGuildForDeletion(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_deletion_tracker.updateOne({ guildId }, { $set: { markedForDeletionAt: new Date() } });
    }

    public async unmarkGuildForDeletion(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_deletion_tracker.updateOne({ guildId }, { $unset: { markedForDeletionAt: 1 } }, { upsert: true });
    }

    public async finallyRemoveGuild(guildId: Discord.Snowflake): Promise<void> {
        await models.guild_deletion_tracker.deleteOne({ guildId });
    }

    public async getNewGuilds(guildIds: Discord.Snowflake[]): Promise<Discord.Snowflake[]> {
        const guildsWeKnowOf = await models.guild_deletion_tracker.find({
            guildId: {
                $in: guildIds,
            },
        }, {
            projection: {
                _id: 0,
                guildId: 1,
            },
        }).toArray();

        const guildIdsWeKnowOf = new Set(guildsWeKnowOf.map(doc => doc.guildId));

        // array of new guilds, that weren't added to the database yet
        return guildIds.filter(id => !guildIdsWeKnowOf.has(id));
    }

    public async getDeletableGuildIds(): Promise<Discord.Snowflake[]> {
        const docs = await models.guild_deletion_tracker.find({
            markedForDeletionAt: {
                $exists: true,
                $lte: new Date(Date.now() - TWO_WEEKS),
            },
        }, {
            projection: {
                _id: 0,
                guildId: 1,
            },
        }).toArray();

        return docs.map(doc => doc.guildId);
    }
}

export default new DataDeletionManager();
