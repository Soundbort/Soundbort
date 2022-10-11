import * as Discord from "discord.js";

import { BUTTON_TYPES } from "../../const";
import Logger from "../../log";

import { doNothing } from "../../util/util";
import { timeout } from "../../util/timers";
import { CmdInstallerArgs } from "../../util/types";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createStringOption } from "../../modules/commands/options/string";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager";
import StatsCollectorManager from "../../core/data-managers/StatsCollectorManager";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";
import { search } from "../../core/soundboard/methods/searchMany";
import { findOne } from "../../core/soundboard/methods/findOne";
import GuildConfigManager from "../../core/data-managers/GuildConfigManager";

const log = Logger.child({ label: "Command => play" });

async function play(interaction: Discord.ChatInputCommandInteraction<"cached"> | Discord.ButtonInteraction<"cached">, sample: CustomSample | StandardSample) {
    try {
        const guild = interaction.guild;

        if (sample instanceof CustomSample && !sample.isInGuilds(guild.id) && !await GuildConfigManager.hasAllowForeignSamples(guild.id)) {
            return replyEmbedEphemeral("Playing samples that aren't from this server's soundboard is not allowed in this server.", EmbedType.Info);
        }

        const member = await guild.members.fetch(interaction.user.id);

        const subscription = await AudioManager.join(member);
        if (subscription === JoinFailureTypes.FailedNotInVoiceChannel) {
            return replyEmbedEphemeral("You need to join a voice channel first!", EmbedType.Info);
        }
        if (subscription === JoinFailureTypes.FailedTryAgain) {
            return replyEmbedEphemeral("Connecting to the voice channel failed. Try again later.", EmbedType.Error);
        }
        if (AudioManager.has(guild.id) && guild.members.me?.voice.channelId && member.voice.channelId !== guild.members.me.voice.channelId) {
            return replyEmbedEphemeral("You need to be in the same voice channel as the bot!", EmbedType.Info);
        }

        await sample.play(subscription.audio_player);

        StatsCollectorManager.incPlayedSamples(1);

        await interaction.reply(replyEmbed(`🔊 Playing ${sample.name}`));
        await timeout(1500);
        await interaction.deleteReply().catch(doNothing);
    } catch (error) {
        log.error("Error while playing", error);
        return replyEmbedEphemeral("Some error happened and caused some whoopsies", EmbedType.Error);
    }
}

export function install({ registry, admin }: CmdInstallerArgs): void {
    registry.addButton({ t: BUTTON_TYPES.PLAY_CUSTOM }, async (interaction, decoded) => {
        if (!interaction.inCachedGuild()) return;

        const id = decoded.id as string;
        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral("That sample doesn't exist anymore.", EmbedType.Error);
        }

        return await play(interaction, sample);
    });

    registry.addButton({ t: BUTTON_TYPES.PLAY_STANDA }, async (interaction, decoded) => {
        if (!interaction.inCachedGuild()) return;

        const name = decoded.n as string;
        const sample = await StandardSample.findByName(name);
        if (!sample) {
            return replyEmbedEphemeral("That sample doesn't exist anymore.", EmbedType.Error);
        }

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
                autocomplete: (name, interaction) => search({
                    admin,
                    name,
                    userId: interaction.user.id,
                    guild: interaction.guild,
                    only_playable: true,
                }),
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
