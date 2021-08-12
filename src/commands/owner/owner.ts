import Discord from "discord.js";

import registry from "../../core/CommandRegistry";
import { TopCommandGroup } from "../../modules/commands/TopCommandGroup";
import { OWNER_IDS, OWNER_GUILD_IDS } from "../../config";
import { createUserPermission } from "../../modules/commands/options/createPermission";

// import commands. We can do this, because they don't register any commands by themselves,
// so if they're already imported by the Core it doesn't matter
import reboot_cmd from "./owner_reboot";
import blacklist_cmd from "./owner_blacklist";
import upload_standard_cmd from "./owner_upload";
import delete_cmd from "./owner_delete";
import backup_cmd from "./owner_backup";

registry.addCommand(new TopCommandGroup({
    name: "owner",
    description: "A set of owner commands.",
    commands: [
        blacklist_cmd,
        upload_standard_cmd,
        delete_cmd,
        backup_cmd,
        reboot_cmd,
    ],
    target: {
        global: false,
        guildHidden: true,
    },
    async onGuildCreate(app_command) {
        const permissions: Discord.ApplicationCommandPermissionData[] = OWNER_IDS.map(id => createUserPermission(id, true));
        await app_command.permissions.set({ permissions });
    },
}));
