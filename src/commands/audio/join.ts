import Discord from "discord.js";

import AudioManager, { JoinFailureTypes } from "../../core/audio/AudioManager";
import InteractionRegistry from "../../core/InteractionRegistry";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/util";

InteractionRegistry.addCommand(new TopCommand({
    name: "join",
    description: "Join the voice channel you are in.",
    async func(interaction: Discord.CommandInteraction) {
        if (!interaction.inGuild() || !interaction.guild) {
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
