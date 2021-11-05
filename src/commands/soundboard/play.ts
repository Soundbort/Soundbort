import Discord from "discord.js";

import { BUTTON_TYPES } from "../../const.js";
import Logger from "../../log.js";

import InteractionRegistry from "../../core/InteractionRegistry.js";
import { CmdInstallerArgs } from "../../util/types.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";
import { TopCommand } from "../../modules/commands/TopCommand.js";
import { CommandStringOption } from "../../modules/commands/CommandOption.js";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager.js";
import { CustomSample } from "../../core/soundboard/CustomSample.js";
import { StandardSample } from "../../core/soundboard/StandardSample.js";
import { search } from "../../core/soundboard/methods/searchMany.js";
import { findOne } from "../../core/soundboard/methods/findOne.js";

const log = Logger.child({ label: "Command => play" });

export function install({ stats_collector }: CmdInstallerArgs): void {
    async function play(interaction: Discord.CommandInteraction | Discord.ButtonInteraction, sample: CustomSample | StandardSample) {
        try {
            // shouldn't true, but Typescript wants it
            if (!interaction.inGuild()) return;

            const member = await interaction.guild?.members.fetch(interaction.user.id);
            if (!member) {
                throw new Error("interaction.guild ist nicht definiert.");
            }

            const subscription = await AudioManager.join(member);
            if (subscription === JoinFailureTypes.FailedNotInVoiceChannel) {
                return replyEmbedEphemeral("You need to join a voice channel first!", EmbedType.Info);
            }
            if (subscription === JoinFailureTypes.FailedTryAgain) {
                return replyEmbedEphemeral("Connecting to the voice channel failed. Try again later.", EmbedType.Error);
            }
            if (AudioManager.has(interaction.guildId) && interaction.guild?.me?.voice.channelId && member.voice.channelId !== interaction.guild.me.voice.channelId) {
                return replyEmbedEphemeral("You need to be in the same voice channel as the bot!", EmbedType.Info);
            }

            await sample.play(subscription.audio_player);

            stats_collector.incPlayedSamples(1);

            return replyEmbedEphemeral(`🔊 Playing ${sample.name}`);
        } catch (error) {
            log.error("Error while playing", error);
            return replyEmbedEphemeral("Some error happened and caused some whoopsies", EmbedType.Error);
        }
    }

    InteractionRegistry.addButton({ t: BUTTON_TYPES.PLAY_CUSTOM }, async (interaction, decoded) => {
        if (!interaction.inGuild()) return;

        const id = decoded.id as string;

        const sample = await CustomSample.findById(id);
        if (!sample) return;

        return await play(interaction, sample);
    });

    InteractionRegistry.addButton({ t: BUTTON_TYPES.PLAY_STANDA }, async (interaction, decoded) => {
        if (!interaction.inGuild()) return;

        const name = decoded.n as string;

        const sample = await StandardSample.findByName(name);
        if (!sample) return;

        return await play(interaction, sample);
    });

    InteractionRegistry.addCommand(new TopCommand({
        name: "play",
        description: "Joins the voice channel if needed and plays the sound sample.",
        options: [
            new CommandStringOption({
                name: "sample",
                description: "A sample name or sample identifier (sXXXXXX)",
                required: true,
                autocomplete(value, interaction) {
                    return search(value, interaction.user.id, interaction.guild);
                },
            }),
        ],
        async func(interaction) {
            if (!interaction.inGuild()) {
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
