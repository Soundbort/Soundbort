import Discord from "discord.js";

import registry from "../core/CommandRegistry";
import { createRoleOption } from "../modules/commands/options/createOption";
import { TopCommandGroup } from "../modules/commands/TopCommandGroup";
import { Command } from "../modules/commands/Command";
import { BOT_NAME } from "../config";
import { EmbedType, replyEmbed } from "../util/util";
import GuildConfigManager from "../core/GuildConfigManager";

const admin_role_cmd = new Command({
    name: "admin-role",
    description: `Set the (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
    options: [
        createRoleOption("role", `The (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`, true),
    ],
    async func(interaction) {
        if (!interaction.inGuild()) {
            return;
        }

        if (!interaction.guild || !await GuildConfigManager.isModerator(interaction.guild, interaction.user.id)) {
            return;
        }

        const role = interaction.options.getRole("role", true);

        await GuildConfigManager.setAdminRole(interaction.guildId, role.id);

        await interaction.reply(replyEmbed("Set the role!", EmbedType.Success));
    },
});

const config_cmd = new TopCommandGroup({
    name: "config",
    description: `Configure ${BOT_NAME} for your server.`,
    commands: [
        admin_role_cmd,
    ],
    target: {
        global: false,
        guildHidden: true,
    },
    // called every time the bot starts
    async onGuildCreate(app_command, guild) {
        const config = await GuildConfigManager.findConfig(guild.id);
        if (!config || !config.adminRoleId) {
            await GuildConfigManager.setAdminRole(guild.id, guild.roles.highest.id);
            return;
        }

        const permissions: Discord.ApplicationCommandPermissionData[] = [{
            id: config.adminRoleId,
            permission: true,
            type: "ROLE",
        }];
        await app_command.permissions.set({ permissions });
    },
});
registry.addCommand(config_cmd);

// called every time the role is changed by a moderator, or every time the bot joins a new guild
GuildConfigManager.onAdminRoleChange(async (guildId, roleId) => {
    const permissions: Discord.ApplicationCommandPermissionData[] = [{
        id: roleId,
        permission: true,
        type: "ROLE",
    }];
    await config_cmd.app_command?.permissions.set({ permissions });
});
