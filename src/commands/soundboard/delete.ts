import Discord from "discord.js";

import { BUTTON_TYPES, SAMPLE_TYPES } from "../../const";

import InteractionRegistry from "../../core/InteractionRegistry";
import { CommandStringOption } from "../../modules/commands/CommandOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import { CustomSample } from "../../core/soundboard/CustomSample";
import GuildConfigManager from "../../core/managers/GuildConfigManager";
import SampleID from "../../core/soundboard/SampleID";

async function removeServer(interaction: Discord.CommandInteraction, name: string) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!guildId || !interaction.guild) {
        return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
    }

    if (!await GuildConfigManager.isModerator(interaction.guild, userId)) {
        return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
    }

    let sample = await CustomSample.findSampleGuild(guildId, name);
    if (!sample && SampleID.isId(name)) {
        sample = await CustomSample.findById(name);
    }

    if (!sample?.isInGuilds(guildId)) {
        sample = undefined;
    }

    if (!sample) {
        return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
    }

    await CustomSample.remove(guildId, sample);

    return replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success);
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
        return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
    }

    await CustomSample.remove(userId, sample);

    return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
}
import { createDialog, DialogOptionsButton } from "../../util/builders/dialog";

InteractionRegistry.addCommand(new TopCommand({
    name: "delete",
    description: "Remove a sample from one of your soundboards.",
    options: [
        new CommandStringOption({
            name: "sample",
            description: "A sample name or sample identifier (sXXXXXX)",
            required: true,
        }),
        new CommandStringOption({
            name: "from",
            description: "In case user or server samples have the same name.",
            choices: [
                createChoice("Only search server samples.", SAMPLE_TYPES.SERVER),
                createChoice("Only search your user samples.", SAMPLE_TYPES.USER),
            ],
        }),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true).trim();
        const scope = interaction.options.getString("from", false) as (SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | null) || SAMPLE_TYPES.USER;

        if (scope === SAMPLE_TYPES.USER) return await removeUser(interaction, name);
        return await removeServer(interaction, name);
    },
}));

InteractionRegistry.addButton({ t: BUTTON_TYPES.DELETE_ASK }, async (interaction, decoded) => {
    if (!interaction.inGuild()) return;

    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) {
        return replyEmbedEphemeral("This sample doesn't exist anymore", EmbedType.Info);
    }

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const hasInUser = sample.isInUsers(userId);
    const hasInGuild = interaction.guild && await GuildConfigManager.isModerator(interaction.guild, userId) && sample.isInGuilds(guildId);

    if (!hasInUser && !hasInGuild) {
        return replyEmbedEphemeral("You can't delete this sample from your personal or this server's soundboard.", EmbedType.Info);
    }

    await createDialog({
        interaction,
        dialog_text:
            "Are you sure you want to delete this sample from your user or server soundboard? " +
            "If you're the creator of this sample, it will be removed from every soundboard it was imported into.",
        dialog_type: EmbedType.Warning,
        abort_type: BUTTON_TYPES.DELETE_ABORT,
        buttons: [
            hasInUser && {
                id: { ...decoded, t: BUTTON_TYPES.DELETE_USER },
                label: "Delete From User Board",
                emoji: "🗑️",
                style: "DANGER",
            },
            hasInGuild && {
                id: { ...decoded, t: BUTTON_TYPES.DELETE_SERVER },
                label: "Delete From Server Board",
                emoji: "🗑️",
                style: "DANGER",
            },
        ].filter(Boolean) as DialogOptionsButton[],
    });
});

InteractionRegistry.addButton({ t: BUTTON_TYPES.DELETE_USER }, async (interaction, decoded) => {
    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    const userId = interaction.user.id;
    if (!sample.isInUsers(userId)) {
        return replyEmbedEphemeral("You don't have this sample in your user soundboard.", EmbedType.Info);
    }

    await CustomSample.remove(userId, sample);

    return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
});

InteractionRegistry.addButton({ t: BUTTON_TYPES.DELETE_SERVER }, async (interaction, decoded) => {
    if (!interaction.inGuild()) return;

    const id = decoded.id as string;

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (!interaction.guild) {
        return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
    }

    if (!await GuildConfigManager.isModerator(interaction.guild, userId)) {
        return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
    }

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    if (!sample.isInGuilds(guildId)) {
        return replyEmbedEphemeral("You don't have this sample in your server soundboard.", EmbedType.Info);
    }

    await CustomSample.remove(guildId, sample);

    return replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success);
});

InteractionRegistry.addButton({ t: BUTTON_TYPES.DELETE_ABORT }, async (interaction, decoded) => {
    const id = decoded.id as (string | null);

    const sample = id && await CustomSample.findById(id);
    if (!sample) {
        return replyEmbed("Aborted deletion of sample.", EmbedType.Info);
    }

    return replyEmbed(`Aborted deletion of sample \`${sample.name}\`.`, EmbedType.Info);
});
