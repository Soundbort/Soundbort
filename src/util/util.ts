import * as Discord from "discord.js";

import { OWNER_IDS } from "../config";

export function isOwner(userId: Discord.Snowflake): boolean {
    return OWNER_IDS.includes(userId);
}

export async function fetchMember(
    guild: Discord.Guild,
    user: Discord.UserResolvable,
    cache: boolean = true,
): Promise<Discord.GuildMember | undefined> {
    try {
        return await guild.members.fetch({ user, cache });
    } catch {
        return undefined;
    }
}

// a function that does nothing (e.g. for Promise.catch() errors we don't care about)
export function doNothing(): void {
    // Do nothing
}
