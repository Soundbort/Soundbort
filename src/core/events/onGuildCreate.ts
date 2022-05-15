import * as Discord from "discord.js";

import DataDeletionManager from "../data-managers/DataDeletionManager";

export default function onGuildCreate() {
    return async (guild: Discord.Guild): Promise<void> => {
        await DataDeletionManager.unmarkGuildForDeletion(guild.id);
    };
}
