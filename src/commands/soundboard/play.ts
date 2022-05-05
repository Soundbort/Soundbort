import * as Discord from "discord.js";

import { BUTTON_TYPES } from "../../const";
import Logger from "../../log";

import { CmdInstallerArgs } from "../../util/types";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createStringOption } from "../../modules/commands/options/string";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager";
import StatsCollectorManager from "../../core/data-managers/StatsCollectorManager";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";
import { search } from "../../core/soundboard/methods/searchMany";
import { findOne } from "../../core/soundboard/methods/findOne";

const log = Logger.child({ label: "Command => play" });

async function play(interaction: Discord.CommandInteraction<"cached"> | Discord.ButtonInteraction<"cached">, sample: CustomSample | StandardSample) {
    try {
        const member = await interaction.guild.members.fetch(interaction.user.id);

        const subscription = await AudioManager.join(member);
        if (subscription === JoinFailureTypes.FailedNotInVoiceChannel) {
            return replyEmbedEphemeral("You need to join a voice channel first!", EmbedType.Info);
        }
        if (subscription === JoinFailureTypes.FailedTryAgain) {
            return replyEmbedEphemeral("Connecting to the voice channel failed. Try again later.", EmbedType.Error);
        }
        if (AudioManager.has(interaction.guildId) && interaction.guild.me?.voice.channelId && member.voice.channelId !== interaction.guild.me.voice.channelId) {
            return replyEmbedEphemeral("You need to be in the same voice channel as the bot!", EmbedType.Info);
        }

        await sample.play(subscription.audio_player);

        StatsCollectorManager.incPlayedSamples(1);

        return replyEmbedEphemeral(`🔊 Playing ${sample.name}`);
    } catch (error) {
        log.error("Error while playing", error);
        return replyEmbedEphemeral("Some error happened and caused some whoopsies", EmbedType.Error);
    }
}

export function install({ registry }: CmdInstallerArgs): void {
    registry.addButton({ t: BUTTON_TYPES.PLAY_CUSTOM }, async (interaction, decoded) => {
        if (!interaction.inCachedGuild()) return;

        const id = decoded.id as string;

        const sample = await CustomSample.findById(id);
        if (!sample) return;

        return await play(interaction, sample);
    });

    registry.addButton({ t: BUTTON_TYPES.PLAY_STANDA }, async (interaction, decoded) => {
        if (!interaction.inCachedGuild()) return;

        const name = decoded.n as string;

        const sample = await StandardSample.findByName(name);
        if (!sample) return;

        return await play(interaction, sample);
    });

    registry.addCommand(new SlashCommand({
        name: "play",
        description: "Joins the voice channel if needed and plays the sound sample.",
        options: [
            createStringOption({
                name: "sample",
                description: "A sample name or sample identifier (sXXXXXX)",
                required: true,
                autocomplete(value, interaction) {
                    return search(value, interaction.user.id, interaction.guild);
                },
            }),
        ],
        permissions: SlashCommandPermissions.EVERYONE,
        async func(interaction) {
            if (!interaction.inCachedGuild()) {
                return replyEmbedEphemeral("Can only play sound clips in servers", EmbedType.Error);
            }

            const name = interaction.options.getString("sample", true).trim();

            const sample = await findOne(name, interaction.user.id, interaction.guildId);
            if (!sample) {
                return replyEmbedEphemeral(`Couldn't find sample with name or id '${name}'`, EmbedType.Error);
            }

            return await play(interaction, sample);
        },
    }));
}
