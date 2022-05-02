import * as Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager";

InteractionRegistry.addCommand(new SlashCommand({
    name: "join",
    description: "Join the voice channel you are in.",
    permissions: SlashCommandPermissions.EVERYONE,
    async func(interaction: Discord.CommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return replyEmbedEphemeral("This commands only works in server channels.", EmbedType.Error);
        }

        const member = await interaction.guild.members.fetch(interaction.member.user.id);
        const subscription = await AudioManager.join(member);

        if (subscription === JoinFailureTypes.FailedNotInVoiceChannel)
            return replyEmbedEphemeral("You must join a voice channel first.", EmbedType.Info);
        if (subscription === JoinFailureTypes.FailedTryAgain)
            return replyEmbedEphemeral("Couldn't join the voice channel you're in... Maybe try again later.", EmbedType.Error);

        return replyEmbed("👍 Joined");
    },
}));
