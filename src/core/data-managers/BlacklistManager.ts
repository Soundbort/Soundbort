import Discord from "discord.js";

import * as models from "../../modules/database/models";

class BlacklistManager {
    async addUser(userId: Discord.Snowflake): Promise<void> {
        await models.blacklist_user.updateOne(
            { userId },
            { $set: { userId } },
            { upsert: true },
        );
    }

    async removeUser(userId: Discord.Snowflake): Promise<void> {
        await models.blacklist_user.deleteOne(
            { userId },
        );
    }

    async isBlacklisted(userId: Discord.Snowflake): Promise<boolean> {
        return !!await models.blacklist_user.findOne({ userId });
    }
}

export default new BlacklistManager();
