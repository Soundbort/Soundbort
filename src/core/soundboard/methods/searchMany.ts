import * as Discord from "discord.js";

import AdminPermissions from "../../permissions/AdminPermissions";

import { ApplicationCommandOptionChoice } from "../../../modules/commands/choice";
import { CustomSample } from "../CustomSample";
import { StandardSample } from "../StandardSample";
import { STANDARD_SAMPLE_PREFIX } from "./findOne";

function compareName(a: { name: string }, b: { name: string }) {
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
}

export async function searchStandard(name: string) {
    const standard_samples = await StandardSample.fuzzySearch(name);

    const choices: ApplicationCommandOptionChoice<string>[] = standard_samples
        .map(sample => ({
            name: sample.name,
            value: sample.name,
        }))
        .sort(compareName);

    return choices;
}

async function searchNonGuild(name: string, userId: Discord.Snowflake, only_deletable: boolean) {
    const [
        standard_samples, custom_samples,
    ] = await Promise.all([
        !only_deletable ? StandardSample.fuzzySearch(name) : [],
        CustomSample.fuzzySearch(name, { userId }),
    ]);

    const choices: ApplicationCommandOptionChoice<string>[] = [
        ...standard_samples.map(sample => ({
            name: `${sample.name} (standard)`,
            value: STANDARD_SAMPLE_PREFIX + sample.name,
        })),
        ...custom_samples.map(sample => ({
            name: `${sample.name} (user)`,
            value: sample.id,
        })),
    ].sort(compareName);

    return choices;
}

async function searchGuild(admin: AdminPermissions, name: string, userId: Discord.Snowflake, guild: Discord.Guild, only_deletable: boolean) {
    let do_list_guild_samples = true;

    if (only_deletable && !await admin.isAdmin(guild, userId)) {
        do_list_guild_samples = false;
    }

    const [
        standard_samples, custom_samples,
    ] = await Promise.all([
        !only_deletable ? StandardSample.fuzzySearch(name) : [],
        CustomSample.fuzzySearch(name, {
            userId: userId,
            guildId: do_list_guild_samples ? guild.id : undefined,
        }),
    ]);

    const choices: ApplicationCommandOptionChoice<string>[] = [
        ...standard_samples.map(sample => ({
            name: `${sample.name} (standard)`,
            value: STANDARD_SAMPLE_PREFIX + sample.name,
        })),
        ...custom_samples.map(sample => ({
            name: `${sample.name} (${[sample.isInUsers(userId) && "user", sample.isInGuilds(guild.id) && "server"].filter(Boolean).join(", ")})`,
            value: sample.id,
        })),
    ].sort(compareName);

    return choices;
}

interface SearchOptions {
    admin: AdminPermissions;
    name: string;
    userId: Discord.Snowflake;
    guild?: Discord.Guild | null;
    only_deletable?: boolean;
}

export async function search({ admin, name, userId, guild, only_deletable = false }: SearchOptions) {
    if (!guild) return await searchNonGuild(name, userId, only_deletable);
    return await searchGuild(admin, name, userId, guild, only_deletable);
}
