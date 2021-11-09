import Discord from "discord.js";

import DataDeletionManager from "../data-managers/DataDeletionManager";

/*
 * TODO:
 * wanted solution:
 * listen for guildDelete event and mark those guilds fore deletion.
 *
 * problem:
 * if bot goes offline and guilds are deleted, those guilds are not marked
 * for deletion
 *
 * personally I didn't find a way to reliably check what guilds the bot was
 * removed from while it was offline, with a solution that also scales.
 * Because of how guilds are split up over all the bot instances, you can easily
 * check what guilds were added - by asking the DB what guild ids it doesn't know of -
 * but not what guilds were removed, without a solution, where you need to get the
 * whole list of active guilds and the whole list of old guilds stored in the DB to
 * compare them, either client-side or DB-side. 200 might still be okay,
 * but thousands and ten-thousands of guilds, this becomes intense, because I
 * can send the DB all guild ids of the current shard, and it marks the ones I
 * didn't send as deletable, but that will also mark all active guilds from other
 * shards as deletable.
 *
 * A possible way to solve this is narrowing down the DB entries to mutate with
 * the formula Discord uses to split up guilds over all shards, but this of course
 * only works with 64-bit integers, and guildIds - and all other Snowflakes - are stored
 * as strings in the database. If discord.js supports javascript bigints (mognodb
 * nodejs already does: new Long(bigint), Long.toBigInt()), then this could become
 * a possibility (if mongodb supports doing calculations as filters, i haven't looked)
 * Still that scales linearly, and maybe that's too steap.
 */

export default function onGuildDelete() {
    return async (guild: Discord.Guild): Promise<void> => {
        await DataDeletionManager.markGuildForDeletion(guild.id);
    };
}
