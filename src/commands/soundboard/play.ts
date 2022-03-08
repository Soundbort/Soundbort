import * as Discord from "discord.js";

import { BUTTON_TYPES } from "../../const";
import Logger from "../../log";

import timer from "../../util/timer";

import InteractionRegistry from "../../core/InteractionRegistry";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";
import { TopCommand } from "../../modules/commands/TopCommand";
import { CommandStringOption } from "../../modules/commands/CommandOption";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager";
import GuildConfigManager from "../../core/data-managers/GuildConfigManager";
import StatsCollectorManager from "../../core/data-managers/StatsCollectorManager";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";
import { search } from "../../core/soundboard/methods/searchMany";
import { findOne } from "../../core/soundboard/methods/findOne";

const log = Logger.child({ label: "Command => play" });

async function play(interaction: Discord.CommandInteraction<"cached"> | Discord.ButtonInteraction<"cached">, sample: CustomSample | StandardSample, start_timer: bigint) {
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

        const config = await GuildConfigManager.findOrGenerateConfig(interaction.guild);

        log.debug(
            "Time to play sample '%s' in '%s' channel '%s' took %dms",
            sample instanceof CustomSample ? sample.id : sample.name,
            interaction.guildId,
            subscription.voice_connection.joinConfig.channelId,
            timer.diffMs(start_timer),
        );

        await sample.play(subscription.audio_player, config.volume);

        StatsCollectorManager.incPlayedSamples(1);

        return replyEmbedEphemeral(`🔊 Playing ${sample.name}`);
    } catch (error) {
        log.error("Error while playing", error);
        return replyEmbedEphemeral("Some error happened and caused some whoopsies", EmbedType.Error);
    }
}

InteractionRegistry.addButton({ t: BUTTON_TYPES.PLAY_CUSTOM }, async (interaction, decoded) => {
    if (!interaction.inCachedGuild()) return;

    const start_timer = timer();
    const id = decoded.id as string;

    const sample = await CustomSample.findById(id);
    if (!sample) return;

    return await play(interaction, sample, start_timer);
});

InteractionRegistry.addButton({ t: BUTTON_TYPES.PLAY_STANDA }, async (interaction, decoded) => {
    if (!interaction.inCachedGuild()) return;

    const start_timer = timer();
    const name = decoded.n as string;

    const sample = await StandardSample.findByName(name);
    if (!sample) return;

    return await play(interaction, sample, start_timer);
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
        if (!interaction.inCachedGuild()) {
            return replyEmbedEphemeral("Can only play sound clips in servers", EmbedType.Error);
        }

        const start_timer = timer();
        const name = interaction.options.getString("sample", true).trim();

        const sample = await findOne(name, interaction.user.id, interaction.guildId);
        if (!sample) {
            return replyEmbedEphemeral(`Couldn't find sample with name or id '${name}'`, EmbedType.Error);
        }

        return await play(interaction, sample, start_timer);
    },
}));
