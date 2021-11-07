import { Command } from "../../modules/commands/Command.js";
import { CommandGroup } from "../../modules/commands/CommandGroup.js";
import { CommandStringOption } from "../../modules/commands/CommandOption.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";

import BlacklistManager from "../../core/data-managers/BlacklistManager.js";

const blacklist_add_cmd = new Command({
    name: "add",
    description: "Blacklist a user from using this bot.",
    options: [
        new CommandStringOption({
            name: "user-id",
            description: "User id to blacklist",
            required: true,
        }),
    ],
    async func(interaction) {
        const userId = interaction.options.getString("user-id", true).trim();

        await BlacklistManager.addUser(userId);

        return replyEmbedEphemeral("Blacklisted user.", EmbedType.Success);
    },
});

const blacklist_remove_cmd = new Command({
    name: "remove",
    description: "Remove blacklisting of user.",
    options: [
        new CommandStringOption({
            name: "user-id",
            description: "User id to remove from blacklist",
            required: true,
        }),
    ],
    async func(interaction) {
        const userId = interaction.options.getString("user-id", true).trim();

        await BlacklistManager.removeUser(userId);

        return replyEmbedEphemeral("Removed user from blacklist.", EmbedType.Success);
    },
});

export default new CommandGroup({
    name: "blacklist",
    description: "Blacklist a user from using this bot.",
    commands: [
        blacklist_add_cmd,
        blacklist_remove_cmd,
    ],
});
