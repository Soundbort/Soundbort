import * as Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import AudioManager from "../../core/audio/AudioManager";

InteractionRegistry.addCommand(new SlashCommand({
    name: "leave",
    description: "Leave the voice channel.",
    permissions: SlashCommandPermissions.EVERYONE,
    func(interaction: Discord.CommandInteraction) {
        if (!interaction.inGuild()) {
            return replyEmbedEphemeral("This commands only works in server channels.", EmbedType.Error);
        }

        const subscription = AudioManager.get(interaction.guildId);
        if (!subscription) return replyEmbedEphemeral("I am not in a voice channel.", EmbedType.Info);

        subscription.destroy();

        return replyEmbed("👋 Bye");
    },
}));
