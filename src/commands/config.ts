import { BOT_NAME } from "../config";

import { CmdInstallerArgs } from "../util/types";
import { EmbedType, replyEmbedEphemeral } from "../util/builders/embed";
import { SlashCommand } from "../modules/commands/SlashCommand";
import { SlashSubCommand } from "../modules/commands/SlashSubCommand";
import { SlashCommandPermissions } from "../modules/commands/permission/SlashCommandPermissions";

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

export function install({ registry }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "config",
        description: `Configure ${BOT_NAME} for your server.`,
        commands: [
            set_admin_role_cmd,
            // TODO: add config commands
        ],
        permissions: SlashCommandPermissions.ADMIN,
    }));
}
