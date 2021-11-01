import Discord from "discord.js";

import { OWNER_IDS, OWNER_GUILD_IDS } from "../../config";
import { isOwner } from "../../util/util";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";
import InteractionRegistry from "../../core/InteractionRegistry";
import { TopCommandGroup } from "../../modules/commands/TopCommandGroup";
import { createUserPermission } from "../../modules/commands/options/createPermission";

// import commands. We can do this, because they don't register any commands by themselves,
// so if they're already imported by the Core it doesn't matter
import reboot_cmd from "./owner_reboot";
import blacklist_cmd from "./owner_blacklist";
import upload_standard_cmd from "./owner_upload";
import delete_cmd from "./owner_delete";
import backup_cmd from "./owner_backup";
import import_cmd from "./owner_import";

InteractionRegistry.addCommand(new TopCommandGroup({
    name: "owner",
    description: "A set of owner commands.",
    commands: [
        blacklist_cmd,
        upload_standard_cmd,
        delete_cmd,
        import_cmd,
        backup_cmd,
        reboot_cmd,
    ],
    target: {
        global: false,
        guildHidden: true,
        // this way, owner commands are only available in specific guilds
        // (since they are greyed out instead of hidden if users dont have the permissions to use them)
        guild_ids: OWNER_GUILD_IDS,
    },
    async middleware(interaction) {
        if (isOwner(interaction.user.id)) return true;

        await interaction.reply(replyEmbedEphemeral("You need to be a bot developer for that.", EmbedType.Error));
        return false;
    },
    async onGuildCreate(app_command) {
        const permissions: Discord.ApplicationCommandPermissionData[] = OWNER_IDS.map(id => createUserPermission(id, true));
        await app_command.permissions.set({ permissions });
    },
}));
