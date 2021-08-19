import Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbedEphemeral } from "../../util/util";
import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import GuildConfigManager from "../../core/GuildConfigManager";
import { BUTTON_TYPES } from "../../const";
import { MAX_SAMPLES, UploadErrors } from "../../core/soundboard/methods/upload";

async function importUser(interaction: Discord.ButtonInteraction | Discord.CommandInteraction, sample: CustomSample) {
    const user = interaction.user;

    // is soundboard full?
    const sample_count = await CustomSample.countUserSamples(user.id);

    if (sample_count >= MAX_SAMPLES) {
        return replyEmbedEphemeral(UploadErrors.TooManySamples, EmbedType.Error);
    }

    if (await CustomSample.findSampleUser(user.id, sample.name)) {
        return replyEmbedEphemeral("You already have a sample with this name in your soundboard.", EmbedType.Error);
    }

    await CustomSample.import(user, sample);

    return sample.toEmbed({ description: `Successfully imported sample "${sample.name}."`, type: EmbedType.Success });
}

async function importServer(interaction: Discord.ButtonInteraction | Discord.CommandInteraction, sample: CustomSample) {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guildId || !guild) {
        return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
    }

    if (!await GuildConfigManager.isModerator(guild, user.id)) {
        return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
    }

    // is soundboard full?
    const sample_count = await CustomSample.countGuildSamples(guildId);

    if (sample_count >= MAX_SAMPLES) {
        return replyEmbedEphemeral(UploadErrors.TooManySamples, EmbedType.Error);
    }

    if (await CustomSample.findSampleGuild(guildId, sample.name)) {
        return replyEmbedEphemeral("You already have a sample with this name in your soundboard.", EmbedType.Error);
    }

    await CustomSample.import(guild, sample);

    return sample.toEmbed({ description: `Successfully imported sample "${sample.name}."`, type: EmbedType.Success });
}

InteractionRegistry.addCommand(new TopCommand({
    name: "import",
    description: "Import a sample from another user or server to your or your server's soundboard.",
    options: [
        createStringOption("sample_id", "A sample identifier (sXXXXXX). Get the ID of a sample from typing `/info <name>`.", true),
        createStringOption("to", "Choose the soundboard to import the sound to. Defaults to your personal soundboard.", false, [
            createChoice("Import into your personal soundboard.", "user"),
            createChoice("Import into server soundboard for every member to use.", "server"),
        ]),
    ],
    async func(interaction) {
        const id = interaction.options.getString("sample_id", true).trim();
        const scope = interaction.options.getString("to", false) as ("user" | "server" | null) || "user";

        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral(`Couldn't find sample with id ${id}`, EmbedType.Error);
        }

        if (!sample.importable) {
            return replyEmbedEphemeral("This sample is marked as not importable.", EmbedType.Error);
        }

        if (scope === "user") return await importUser(interaction, sample);
        return await importServer(interaction, sample);
    },
}));

InteractionRegistry.addButton({ t: BUTTON_TYPES.IMPORT_USER }, async (interaction, decoded) => {
    if (!interaction.inGuild()) return;

    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    return await importUser(interaction, sample);
});

InteractionRegistry.addButton({ t: BUTTON_TYPES.IMPORT_SERVER }, async (interaction, decoded) => {
    if (!interaction.inGuild()) return;

    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    return await importServer(interaction, sample);
});
