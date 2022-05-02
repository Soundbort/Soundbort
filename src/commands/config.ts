import { BOT_NAME } from "../config";

import InteractionRegistry from "../core/InteractionRegistry";
import { EmbedType, replyEmbed } from "../util/builders/embed";
import { SlashCommand } from "../modules/commands/SlashCommand";
import { SlashSubCommand } from "../modules/commands/SlashSubCommand";
import { SlashCommandPermissions } from "../modules/commands/permission/SlashCommandPermissions";
import { createRoleOption } from "../modules/commands/options/role";

import GuildConfigManager from "../core/data-managers/GuildConfigManager";

const set_admin_role_cmd = new SlashSubCommand({
    name: "set-admin-role",
    description: `Set the (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
    options: [
        createRoleOption({
            name: "role",
            description: `The (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
            required: true,
        }),
    ],
    async func(interaction) {
        if (!interaction.inCachedGuild() || !await GuildConfigManager.isModerator(interaction.guild, interaction.user.id)) {
            return;
        }

        const role = interaction.options.getRole("role", true);

        await GuildConfigManager.setAdminRole(interaction.guildId, role.id);

        return replyEmbed("Set the role!", EmbedType.Success);
    },
});

const show_admin_role_cmd = new SlashSubCommand({
    name: "show-admin-role",
    description: `Shows the (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
    async func(interaction) {
        if (!interaction.inCachedGuild()) return;

        const config = await GuildConfigManager.findOrGenConfig(interaction.guild);
        if (!config) {
            return;
        }

        const role = await interaction.guild.roles.fetch(config.adminRoleId);

        return replyEmbed(`Admin role is ${role?.toString()}`, EmbedType.Info);
    },
});

InteractionRegistry.addCommand(new SlashCommand({
    name: "config",
    description: `Configure ${BOT_NAME} for your server.`,
    commands: [
        set_admin_role_cmd,
        show_admin_role_cmd,
    ],
    permissions: SlashCommandPermissions.ADMIN,
    // called every time the bot starts
    async onGuildCreate(guild) {
        // generate config
        await GuildConfigManager.findOrGenConfig(guild);
    },
}));
