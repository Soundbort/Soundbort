import Discord from "discord.js";

import GuildConfigManager from "../../data-managers/GuildConfigManager.js";
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

    const choices: Discord.ApplicationCommandOptionChoice[] = standard_samples
        .map(sample => ({
            name: sample.name,
            value: sample.name,
        }))
        .sort(compareName);

    return choices;
}

export async function search(name: string, userId: Discord.Snowflake, guild?: Discord.Guild | null, only_deletable: boolean = false) {
    if (!guild) {
        const [
            standard_samples, custom_samples,
        ] = await Promise.all([
            !only_deletable ? StandardSample.fuzzySearch(name) : [],
            CustomSample.fuzzySearch(name, { userId }),
        ]);

        const choices: Discord.ApplicationCommandOptionChoice[] = [
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

    let do_list_guild_samples = true;

    if (only_deletable && !await GuildConfigManager.isModerator(guild, userId)) {
        do_list_guild_samples = false;
    }

    const [
        standard_samples, custom_samples,
    ] = await Promise.all([
        !only_deletable ? StandardSample.fuzzySearch(name) : [],
        CustomSample.fuzzySearch(name, { userId, guildId: do_list_guild_samples ? guild.id : undefined }),
    ]);

    const choices: Discord.ApplicationCommandOptionChoice[] = [
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
