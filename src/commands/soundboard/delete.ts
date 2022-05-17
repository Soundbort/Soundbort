import * as Discord from "discord.js";

import { BUTTON_TYPES } from "../../const";

import { CmdInstallerArgs } from "../../util/types";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createStringOption } from "../../modules/commands/options/string";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";
import { DialogOptionsButton, createDialog } from "../../util/builders/dialog";

import { CustomSample } from "../../core/soundboard/CustomSample";
import SampleID from "../../core/soundboard/SampleID";
import { search } from "../../core/soundboard/methods/searchMany";

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

export function install({ registry, admin }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "delete",
        description: "Remove a sample from one of your soundboards.",
        options: [
            createStringOption({
                name: "sample",
                description: "A sample name or sample identifier (sXXXXXX)",
                required: true,
                autocomplete: (name, interaction) => search({
                    admin,
                    name,
                    userId: interaction.user.id,
                    guild: interaction.guild,
                    only_deletable: true,
                }),
            }),
        ],
        permissions: SlashCommandPermissions.EVERYONE,
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

            const is_admin = await admin.isAdmin(guild, userId);

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

    registry.addButton({ t: BUTTON_TYPES.DELETE_ASK }, async (interaction, decoded) => {
        const id = decoded.id as string;
        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral("This sample doesn't exist anymore", EmbedType.Info);
        }

        const hasInUser = sample.isInUsers(interaction.user.id);
        const hasInGuild = interaction.inCachedGuild()
            && await admin.isAdmin(interaction.guild, interaction.member.id)
            && sample.isInGuilds(interaction.guildId);

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

    registry.addButton({ t: BUTTON_TYPES.DELETE_USER }, async (interaction, decoded) => {
        const id = decoded.id as string;
        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral("That sample doesn't exist anymore.", EmbedType.Error);
        }

        const userId = interaction.user.id;
        if (!sample.isInUsers(userId)) {
            return replyEmbedEphemeral("You don't have this sample in your user soundboard.", EmbedType.Info);
        }

        await CustomSample.remove(userId, sample);

        return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
    });

    registry.addButton({ t: BUTTON_TYPES.DELETE_SERVER }, async (interaction, decoded) => {
        if (!interaction.inCachedGuild()) {
            return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
        }

        const admin_permissions = await admin.isAdmin(interaction.guild, interaction.member.id);
        if (!admin_permissions) {
            return replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error);
        }

        const id = decoded.id as string;
        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral("That sample doesn't exist anymore.", EmbedType.Error);
        }

        const guildId = interaction.guildId;

        if (!sample.isInGuilds(guildId)) {
            return replyEmbedEphemeral("You don't have this sample in your server soundboard.", EmbedType.Info);
        }

        await CustomSample.remove(guildId, sample);

        return replyEmbed(`Removed ${sample.name} (${sample.id}) from server soundboard!`, EmbedType.Success);
    });

    registry.addButton({ t: BUTTON_TYPES.DELETE_ABORT }, async (interaction, decoded) => {
        const id = decoded.id as (string | null);
        const sample = id && await CustomSample.findById(id);
        if (!sample) {
            return replyEmbed("Aborted deletion of sample.", EmbedType.Info);
        }

        return replyEmbed(`Aborted deletion of sample \`${sample.name}\`.`, EmbedType.Info);
    });
}
