import Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import AudioManager from "../../core/audio/AudioManager";

InteractionRegistry.addCommand(new TopCommand({
    name: "stop",
    description: "Stops all currently playing audio.",
    func(interaction: Discord.CommandInteraction) {
        if (!interaction.inGuild() || !interaction.guild) {
            return replyEmbedEphemeral("This commands only works in server channels.", EmbedType.Error);
        }

        const subscription = AudioManager.get(interaction.guildId);
        if (!subscription) return replyEmbedEphemeral("I am not in a voice channel.", EmbedType.Info);

        subscription.stop();

        return replyEmbed("👍 Done did");
    },
}));
