import { OWNER_GUILD_IDS } from "../config.js";

import { canUseCommand } from "../util/permissions.js";

import { CmdInstallerArgs } from "../util/types.js";
import timer from "../util/timer.js";

import { SlashCommand } from "../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../modules/commands/permission/SlashCommandPermissions.js";
import { createStringOption } from "../modules/commands/options/string.js";

export function install({ registry }: CmdInstallerArgs) {
    registry.addCommand(new SlashCommand({
        name: "permission-test",
        description: "Test to see permissions of config command.",
        permissions: SlashCommandPermissions.EVERYONE,
        exclusive_guild_ids: OWNER_GUILD_IDS,
        options: [
            createStringOption({
                name: "command_name",
                description: "Name of the command to test.",
                required: true,
            }),
        ],
        async func(interaction) {
            if (!interaction.inCachedGuild()) {
                return;
            }

            const command_name = interaction.options.getString("command_name", true);

            const start = timer();

            const guvana = await interaction.guild.members.fetch({ force: true, user: "145476365112573953" });

            const config_command = registry.getApplicationCommand(interaction.guild.id, command_name);
            if (!config_command) {
                throw new Error("The 'config' api command couldnt be found in cache.");
            }

            const admin_permissions = await canUseCommand(config_command, interaction.guild, interaction.channelId, guvana.id);

            return `
    \`\`\`
    Channel access: ${admin_permissions.channel}
    User access: ${admin_permissions.user}
    Time: ${timer.diffMs(start).toFixed(3)}ms
    \`\`\`
            `;
        },
    }));
}
