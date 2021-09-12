import { OWNER_IDS } from "../config";
import Discord from "discord.js";

export function isOwner(userId: Discord.Snowflake): boolean {
    return OWNER_IDS.includes(userId);
}

export function guessModRole(guild: Discord.Guild): Discord.Role {
    for (const [, role] of guild.roles.cache.sort((a, b) => b.comparePositionTo(a))) {
        if (/^(mod(erator|eration)?)|(admin(istrator|istration)?)$/i.test(role.name)) return role;
    }

    return guild.roles.highest;
}

export async function fetchMember(
    guild: Discord.Guild,
    user: Discord.UserResolvable,
    cache: boolean = true,
): Promise<Discord.GuildMember | null> {
    try {
        return await guild.members.fetch({ user, cache });
    } catch {
        return null;
    }
}

type _any = any;

export function logErr(error: _any): Error {
    const err = {
        ...error,
        message: error.message,
        name: error.name,
        stack: error.stack,
    };
    Object.setPrototypeOf(err, Error.prototype);
    return err;
}

// a function that does nothing (e.g. for Promise.catch() errors we don't care about)
export function doNothing(): void {
    // Do nothing
}
