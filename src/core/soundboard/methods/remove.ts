import Discord from "discord.js";

import { EmbedType, isOwner, replyEmbed, replyEmbedEphemeral } from "../../../util/util";
import SampleID from "../SampleID";
import { CustomSample } from "../sample/CustomSample";
import { PredefinedSample } from "../sample/PredefinedSample";
import GuildConfigManager from "../../GuildConfigManager";

async function removeStandard(interaction: Discord.CommandInteraction, name: string): Promise<void> {
    const userId = interaction.user.id;

    if (!isOwner(userId)) {
        return await interaction.reply(replyEmbedEphemeral("You're not a bot developer, you can't remove standard samples.", EmbedType.Error));
    }

    const sample = await PredefinedSample.findByName(name);
    if (!sample) {
        return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error));
    }

    await PredefinedSample.remove(sample);

    return await interaction.reply(replyEmbed(`Removed ${sample.name} from standard soundboard!`, EmbedType.Success));
}

async function removeServer(interaction: Discord.CommandInteraction, name: string) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId || !interaction.guild) {
        return await interaction.reply(replyEmbedEphemeral("You're not in a server.", EmbedType.Error));
    }

    if (!GuildConfigManager.isModerator(interaction.guild, userId)) {
        return await interaction.reply(replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error));
    }

    let sample = await CustomSample.findSampleGuild(guildId, name);
    if (!sample && SampleID.isId(name)) {
        sample = await CustomSample.findById(name);
    }

    if (!sample?.isInGuilds(guildId)) {
        sample = undefined;
    }

    if (!sample) {
        return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error));
    }

    await CustomSample.remove(guildId, sample);

    return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success));
}

async function removeUser(interaction: Discord.CommandInteraction, name: string) {
    const userId = interaction.user.id;

    let sample = await CustomSample.findSampleUser(userId, name);
    if (!sample && SampleID.isId(name)) {
        sample = await CustomSample.findById(name);
    }

    if (!sample?.isInUsers(userId)) {
        sample = undefined;
    }

    if (!sample) {
        return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error));
    }

    await CustomSample.remove(userId, sample);

    return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success));
}

export async function remove(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<void> {
    if (scope === "standard") return await removeStandard(interaction, name);

    if (scope === "server") return await removeServer(interaction, name);

    return await removeUser(interaction, name);
}
