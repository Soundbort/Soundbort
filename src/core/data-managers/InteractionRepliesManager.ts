import * as Discord from "discord.js";

import * as models from "../../modules/database/models";
import { InteractionRepliesSchema } from "../../modules/database/schemas/InteractionRepliesSchema";

class InteractionRepliesManager {
    async add(interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction, messageId: Discord.Snowflake, refId?: string): Promise<void> {
        await models.interaction_replies.insertOne({
            interactionId: refId ?? interaction.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            messageId: messageId,
        });
    }

    async removeFromGuild(guildId: Discord.Snowflake): Promise<void> {
        await models.interaction_replies.deleteMany({
            guildId,
        });
    }

    async fetch(refId: string): Promise<InteractionRepliesSchema | undefined> {
        return await models.interaction_replies.findOne({ interactionId: refId });
    }
}

export default new InteractionRepliesManager();
