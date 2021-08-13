import Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/util";

import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import GuildConfigManager from "../../core/GuildConfigManager";
import SampleID from "../../core/soundboard/SampleID";
import { BUTTON_TYPES } from "../../const";

async function removeServer(interaction: Discord.CommandInteraction, name: string) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId || !interaction.guild) {
        return await interaction.reply(replyEmbedEphemeral("You're not in a server.", EmbedType.Error));
    }

    if (!await GuildConfigManager.isModerator(interaction.guild, userId)) {
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

InteractionRegistry.addCommand(new TopCommand({
    name: "delete",
    description: "Remove a sample from one of your soundboards.",
    options: [
        createStringOption("sample", "A sample name or sample identifier (sXXXXXX)", true),
        createStringOption("from", "In case user or server samples have the same name.", false, [
            createChoice("Only search server samples.", "server"),
            createChoice("Only search your user samples.", "user"),
        ]),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true);
        const scope = interaction.options.getString("from", false) as ("user" | "server" | null) || "user";

        if (scope === "user") await removeUser(interaction, name);
        else await removeServer(interaction, name);
    },
}));

InteractionRegistry.addButton({ t: BUTTON_TYPES.DELETE }, async (interaction, decoded) => {
    if (!interaction.inGuild()) return;

    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    const userId = interaction.user.id;
    if (sample.isInUsers(userId)) {
        await CustomSample.remove(userId, sample);

        return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success));
    }

    const guildId = interaction.guildId;
    if (sample.isInGuilds(guildId)) {
        if (!interaction.guild) {
            return await interaction.reply(replyEmbedEphemeral("You're not in a server.", EmbedType.Error));
        }

        if (!await GuildConfigManager.isModerator(interaction.guild, userId)) {
            return await interaction.reply(replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error));
        }

        await CustomSample.remove(guildId, sample);

        return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success));
    }

    return await interaction.reply(replyEmbedEphemeral("You don't have this sample in your soundboards.", EmbedType.Info));
});
