import Discord from "discord.js";

import GuildConfigManager from "../managers/GuildConfigManager.js";
import DataDeletionManager from "../managers/DataDeletionManager.js";

export default function onGuildCreate() {
    return async (guild: Discord.Guild): Promise<void> => {
        await DataDeletionManager.unmarkGuildForDeletion(guild.id);

        await GuildConfigManager.regenConfig(guild);
    };
}
