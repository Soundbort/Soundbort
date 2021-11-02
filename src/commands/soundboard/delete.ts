import Discord from "discord.js";

import { BUTTON_TYPES } from "../../const";

import InteractionRegistry from "../../core/InteractionRegistry";
import { CommandStringOption } from "../../modules/commands/CommandOption";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import { CustomSample } from "../../core/soundboard/CustomSample";
import GuildConfigManager from "../../core/managers/GuildConfigManager";
import SampleID from "../../core/soundboard/SampleID";
import { search } from "../../core/soundboard/methods/searchMany";
import { createDialog, DialogOptionsButton } from "../../util/builders/dialog";

async function dialogSameId(interaction: Discord.CommandInteraction, sampleId: string) {
    await createDialog({
        interaction,
        dialog_text:
            "This sample is part of your user and your server's soundboard. Where do you want to delete it from?",
        dialog_type: EmbedType.Warning,
        abort_type: BUTTON_TYPES.DELETE_ABORT,
        buttons: [{
            id: { id: sampleId, t: BUTTON_TYPES.DELETE_USER },
            label: "Delete From User Board",
            emoji: "🗑️",
            style: "DANGER",
        }, {
            id: { id: sampleId, t: BUTTON_TYPES.DELETE_SERVER },
            label: "Delete From Server Board",
            emoji: "🗑️",
            style: "DANGER",
        }],
    });
}

async function dialogSameName(interaction: Discord.CommandInteraction, userSampleId: string, guildSampleId: string) {
    await createDialog({
        interaction,
        dialog_text:
            "A sample with this name exists in both your user and your server soundboard. Which one do you want to delete?",
        dialog_type: EmbedType.Warning,
        abort_type: BUTTON_TYPES.DELETE_ABORT,
        buttons: [{
            id: { id: userSampleId, t: BUTTON_TYPES.DELETE_USER },
            label: "Delete From User Board",
            emoji: "🗑️",
            style: "DANGER",
        }, {
            id: { id: guildSampleId, t: BUTTON_TYPES.DELETE_SERVER },
            label: "Delete From Server Board",
            emoji: "🗑️",
            style: "DANGER",
        }],
    });
}

InteractionRegistry.addCommand(new TopCommand({
    name: "delete",
    description: "Remove a sample from one of your soundboards.",
    options: [
        new CommandStringOption({
            name: "sample",
            description: "A sample name or sample identifier (sXXXXXX)",
            required: true,
            async autocomplete(value, interaction) {
                return await search(value, interaction.user.id, interaction.guild, true);
            },
        }),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true).trim();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        // more of an experiment. the discord.js types have changed and are now partially wrong and less explicit
        // even though the guildId is always of type Snowflake, it can be null when calling a global command from
        // DMs
        // next: if the guild is not cached, Interaction.guild is null, so try to fetch guild from discord. If not
        // found, an error is thrown, and the command is aborted.
        const guild = guildId && (interaction.guild || await interaction.client.guilds.fetch(guildId));
        if (!guildId || !guild) {
            return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
        }

        const is_admin = await GuildConfigManager.isModerator(guild, userId);

        let sample: CustomSample | undefined;

        // is the input a sample id?
        if (SampleID.isId(name)) {
            sample = await CustomSample.findById(name);
        }

        // is the input a sample id and a sample exists with that id?
        if (sample) {
            const is_in_guild = sample.isInGuilds(guildId);
            const is_in_user = sample.isInUsers(userId);

            if (!is_in_guild && !is_in_user) {
                return replyEmbedEphemeral("You don't have this sample in your soundboard.", EmbedType.Info);
            }

            if (is_admin) {
                if (is_in_guild && is_in_user) {
                    await dialogSameId(interaction, sample.id);

                    return;
                }
                if (is_in_user) {
                    await CustomSample.remove(userId, sample);

                    return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
                }
                if (is_in_guild) {
                    await CustomSample.remove(guildId, sample);

                    return replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success);
                }
                // is_in_guild = false, is_in_user = false
                return;
            }

            if (is_in_guild && !is_in_user) {
                return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
            }

            // (is_in_guild && is_in_user) || (is_in_user && !is_in_guild) || true

            await CustomSample.remove(userId, sample);

            return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
        }

        // the input is not a valid sample id. check for samples with the input as name
        const user_sample = await CustomSample.findSampleUser(userId, name);
        const guild_sample = await CustomSample.findSampleGuild(guildId, name);

        if (!user_sample && !guild_sample) {
            return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
        }

        if (is_admin) {
            if (user_sample && guild_sample) {
                if (user_sample.id === guild_sample.id) {
                    await dialogSameId(interaction, user_sample.id);
                } else {
                    await dialogSameName(interaction, user_sample.id, guild_sample.id);
                }
                return;
            }
            if (user_sample) {
                await CustomSample.remove(userId, user_sample);

                return replyEmbed(`Removed ${user_sample.name} (${user_sample.id}) from user soundboard!`, EmbedType.Success);
            }
            if (guild_sample) {
                await CustomSample.remove(guildId, guild_sample);

                return replyEmbed(`Removed ${guild_sample.name} (${guild_sample.id}) from user soundboard!`, EmbedType.Success);
            }
            // guild_sample = undefined, user_sample = undefined
            return;
        }

        if (guild_sample && !user_sample) {
            return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
        }

        // simply logical it's not possible for user_sample to be undefined at this point, but TS still thinks so,
        // therefore put another if statement as a type guard
        if (!user_sample) return;

        // (is_in_guild && is_in_user) || (!is_in_guild && is_in_user) || true

        await CustomSample.remove(userId, user_sample);

        return replyEmbed(`Removed ${user_sample.name} (${user_sample.id}) from user soundboard!`, EmbedType.Success);
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
