import { OWNER_GUILD_IDS } from "../../config.js";

import { isOwner } from "../../util/util.js";

import { CmdInstallerArgs } from "../../util/types.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";
import { SlashCommand } from "../../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions.js";

// import commands. We can do this, because they don't register any commands by themselves,
// so if they're already imported by the Core it doesn't matter
import reboot_cmd from "./owner_reboot.js";
import blacklist_cmd from "./owner_blacklist.js";
import upload_standard_cmd from "./owner_upload.js";
import delete_cmd from "./owner_delete.js";
import import_cmd from "./owner_import.js";

export function install({ registry }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "owner",
        description: "A set of owner commands.",
        commands: [
            blacklist_cmd,
            upload_standard_cmd,
            delete_cmd,
            import_cmd,
            reboot_cmd,
        ],
        permissions: SlashCommandPermissions.HIDDEN,
        // this way, owner commands are only available in specific guilds
        exclusive_guild_ids: OWNER_GUILD_IDS,
        async middleware(interaction) {
            if (isOwner(interaction.user.id)) return true;

            await interaction.reply(replyEmbedEphemeral("You need to be a bot developer for that.", EmbedType.Error));
            return false;
        },
    }));
}
