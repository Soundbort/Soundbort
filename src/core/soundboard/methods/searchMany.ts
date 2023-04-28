import * as Discord from "discord.js";

import AdminPermissions from "../../permissions/AdminPermissions.js";
import GuildConfigManager from "../../data-managers/GuildConfigManager.js";

import { ApplicationCommandOptionChoice } from "../../../modules/commands/choice/index.js";
import { CustomSample } from "../CustomSample.js";
import { StandardSample } from "../StandardSample.js";
import { STANDARD_SAMPLE_PREFIX } from "./findOne.js";

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

async function searchGuild(admin: AdminPermissions, name: string, userId: Discord.Snowflake, guild: Discord.Guild, only_deletable: boolean, only_playable: boolean) {
    let do_list_guild_samples = true;
    let do_only_list_guild_samples = false;

    if (only_deletable && !await admin.isAdmin(guild, userId)) {
        do_list_guild_samples = false;
    }
    if (only_playable && !await GuildConfigManager.hasAllowForeignSamples(guild.id)) {
        do_only_list_guild_samples = true;
    }

    if (!do_list_guild_samples && do_only_list_guild_samples) {
        return [];
    }

    const [
        standard_samples,
        custom_samples,
    ] = await Promise.all([
        !only_deletable ? StandardSample.fuzzySearch(name) : [] as StandardSample[],
        CustomSample.fuzzySearch(name, {
            userId: !do_only_list_guild_samples ? userId : undefined,
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
    only_playable?: boolean;
}

export async function search({ admin, name, userId, guild, only_deletable = false, only_playable = false }: SearchOptions) {
    if (!guild) {
        return await searchNonGuild(name, userId, only_deletable);
    }
    return await searchGuild(admin, name, userId, guild, only_deletable, only_playable);
}
