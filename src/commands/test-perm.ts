import DiscordPermissions2VUtils from "../util/discord-patch/DiscordPermissionsV2Utils";

import { CmdInstallerArgs } from "../util/types";

import { SlashCommand } from "../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../modules/commands/permission/SlashCommandPermissions";
import timer from "../util/timer";
import { OWNER_GUILD_IDS } from "../config";

export function install({ registry, client }: CmdInstallerArgs) {
    const perm_utils = DiscordPermissions2VUtils.client(client);

    registry.addCommand(new SlashCommand({
        name: "permission-test",
        description: "Test to see permissions of config command.",
        permissions: SlashCommandPermissions.EVERYONE,
        exclusive_guild_ids: OWNER_GUILD_IDS,
        async func(interaction) {
            if (!interaction.inCachedGuild()) {
                return;
            }

            const start = timer();

            const guvana = await interaction.guild.members.fetch({ force: true, user: "145476365112573953" });

            const config_api_command = registry.getAPICommand(interaction.guild.id, "config");
            if (!config_api_command) {
                throw new Error("The 'config' api command couldnt be found in cache.");
            }

            const admin_permissions = await perm_utils.canUseCommand(config_api_command, interaction.guild, interaction.channelId, guvana.id);

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
