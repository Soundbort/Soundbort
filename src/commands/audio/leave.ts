import Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry.js";
import { TopCommand } from "../../modules/commands/TopCommand.js";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed.js";

import AudioManager from "../../core/audio/AudioManager.js";

InteractionRegistry.addCommand(new TopCommand({
    name: "leave",
    description: "Leave the voice channel.",
    func(interaction: Discord.CommandInteraction) {
        if (!interaction.inGuild() || !interaction.guild) {
            return replyEmbedEphemeral("This commands only works in server channels.", EmbedType.Error);
        }

        const subscription = AudioManager.get(interaction.guildId);
        if (!subscription) return replyEmbedEphemeral("I am not in a voice channel.", EmbedType.Info);

        subscription.destroy();

        return replyEmbed("👋 Bye");
    },
}));
