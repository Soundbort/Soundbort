import * as Discord from "discord.js";

import { CmdInstallerArgs } from "../../util/types.js";
import { SlashCommand } from "../../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions.js";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed.js";

import AudioManager from "../../core/audio/AudioManager.js";

export function install({ registry }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "stop",
        description: "Stops all currently playing audio.",
        permissions: SlashCommandPermissions.EVERYONE,
        func(interaction: Discord.ChatInputCommandInteraction) {
            if (!interaction.inGuild()) {
                return replyEmbedEphemeral("This commands only works in server channels.", EmbedType.Error);
            }

            const subscription = AudioManager.get(interaction.guildId);
            if (!subscription) return replyEmbedEphemeral("I am not in a voice channel.", EmbedType.Info);

            subscription.stop();

            return replyEmbed("👍 Done did");
        },
    }));
}
