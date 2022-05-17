import { BOT_NAME } from "../config";

import { CmdInstallerArgs } from "../util/types";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../util/builders/embed";
import { SlashCommand } from "../modules/commands/SlashCommand";
import { SlashSubCommand } from "../modules/commands/SlashSubCommand";
import { SlashCommandPermissions } from "../modules/commands/permission/SlashCommandPermissions";
import { createBooleanOption } from "../modules/commands/options/boolean";

import GuildConfigManager from "../core/data-managers/GuildConfigManager";

const set_admin_role_cmd = new SlashSubCommand({
    name: "set-admin-role",
    description: `Set the (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
    func() {
        return replyEmbedEphemeral(
            "**The way to set admin permissions in Soundbort has changed!**\n\n" +
            "Permissions are now set in the server settings. " +
            "For more info visit [The Server Guide](https://soundbort-guide.loneless.art/guide/server-guide#setting-permissions)",
            EmbedType.Info,
        );
    },
});

const set_foreign_samples = new SlashSubCommand({
    name: "foreign-samples",
    description: "Restrict members to be able to only use samples from this server's soundboard. Default false.",
    options: [
        createBooleanOption({
            name: "allow",
            description: "Allowing foreign samples allows users to use samples from other soundboards than this server's.",
            required: true,
        }),
    ],
    async func(interaction) {
        if (!interaction.inGuild()) {
            return replyEmbedEphemeral("You're not in a server.", EmbedType.Error);
        }

        const allow = interaction.options.getBoolean("allow", true);

        await GuildConfigManager.setAllowForeignSamples(interaction.guildId, allow);

        if (allow) {
            return replyEmbed("Samples from other soundboards are now allowed in this server.", EmbedType.Success);
        }
        return replyEmbed("Samples from other soundboards are no longer allowed in this server.", EmbedType.Success);
    },
});

export function install({ registry }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "config",
        description: `Configure ${BOT_NAME} for your server.`,
        commands: [
            set_admin_role_cmd,
            set_foreign_samples,
        ],
        permissions: SlashCommandPermissions.ADMIN,
    }));
}
