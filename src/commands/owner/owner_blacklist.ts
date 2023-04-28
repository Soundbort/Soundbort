import { SlashSubCommand } from "../../modules/commands/SlashSubCommand.js";
import { SlashSubCommandGroup } from "../../modules/commands/SlashSubCommandGroup.js";
import { createStringOption } from "../../modules/commands/options/string.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";

import BlacklistManager from "../../core/data-managers/BlacklistManager.js";

const blacklist_add_cmd = new SlashSubCommand({
    name: "add",
    description: "Blacklist a user from using this bot.",
    options: [
        createStringOption({
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

const blacklist_remove_cmd = new SlashSubCommand({
    name: "remove",
    description: "Remove blacklisting of user.",
    options: [
        createStringOption({
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

export default new SlashSubCommandGroup({
    name: "blacklist",
    description: "Blacklist a user from using this bot.",
    commands: [
        blacklist_add_cmd,
        blacklist_remove_cmd,
    ],
});
