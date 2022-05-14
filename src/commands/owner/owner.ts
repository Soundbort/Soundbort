import { OWNER_GUILD_IDS } from "../../config";

import { isOwner } from "../../util/util";

import { CmdInstallerArgs } from "../../util/types";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";

// import commands. We can do this, because they don't register any commands by themselves,
// so if they're already imported by the Core it doesn't matter
import reboot_cmd from "./owner_reboot";
import blacklist_cmd from "./owner_blacklist";
import uploadCmdGenerator from "./owner_upload";
import delete_cmd from "./owner_delete";
import import_cmd from "./owner_import";

export function install({ registry, admin }: CmdInstallerArgs): void {
    const upload_standard_cmd = uploadCmdGenerator(admin);

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
