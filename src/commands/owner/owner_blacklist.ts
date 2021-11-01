import { Command } from "../../modules/commands/Command";
import { CommandGroup } from "../../modules/commands/CommandGroup";
import { createStringOption } from "../../modules/commands/options/createOption";
import * as models from "../../modules/database/models";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

const blacklist_add_cmd = new Command({
    name: "add",
    description: "Blacklist a user from using this bot.",
    options: [
        createStringOption("user-id", "User id to blacklist", true),
    ],
    async func(interaction) {
        const userId = interaction.options.getString("user-id", true).trim();

        await models.blacklist_user.updateOne(
            { userId: userId },
            { $set: { userId: userId } },
            { upsert: true },
        );

        return replyEmbedEphemeral("Blacklisted user.", EmbedType.Success);
    },
});

const blacklist_remove_cmd = new Command({
    name: "remove",
    description: "Remove blacklisting of user.",
    options: [
        createStringOption("user-id", "User id to remove from blacklist", true),
    ],
    async func(interaction) {
        const userId = interaction.options.getString("user-id", true).trim();

        await models.blacklist_user.deleteOne(
            { userId: userId },
        );

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
