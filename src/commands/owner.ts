import Discord from "discord.js";

import registry from "../core/CommandRegistry";
import { createStringOption } from "../modules/commands/options/createOption";
import { TopCommandGroup } from "../modules/commands/TopCommandGroup";
import { Command } from "../modules/commands/Command";
import { CommandGroup } from "../modules/commands/CommandGroup";
import { exit } from "../util/exit";
import { EmbedType, isOwner, replyEmbed, replyEmbedEphemeral } from "../util/util";
import { CustomSample } from "../core/soundboard/sample/CustomSample";
import SampleID from "../core/soundboard/SampleID";
import { OWNER_IDS } from "../config";
import { collectionBlacklistUser } from "../modules/database/models";
import { createUserPermission } from "../modules/commands/options/createPermission";
import { upload } from "../core/soundboard/methods/upload";
import { remove } from "../core/soundboard/methods/remove";

const blacklist_add_cmd = new Command({
    name: "add",
    description: "Blacklist a user from using this bot.",
    options: [
        createStringOption("user-id", "User id to blacklist", true),
    ],
    async func(interaction) {
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply(replyEmbedEphemeral("You're not a bot developer, you can't just remove any sample.", EmbedType.Error));
        }

        const userId = interaction.options.getString("user-id", true);

        await collectionBlacklistUser().updateOne(
            { userId: userId },
            { $set: { userId: userId } },
            { upsert: true },
        );

        await interaction.reply(replyEmbedEphemeral("Blacklisted user.", EmbedType.Success));
    },
});

const blacklist_remove_cmd = new Command({
    name: "remove",
    description: "Remove blacklisting of user.",
    options: [
        createStringOption("user-id", "User id to remove from blacklist", true),
    ],
    async func(interaction) {
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply(replyEmbedEphemeral("You're not a bot developer, you can't just remove any sample.", EmbedType.Error));
        }

        const userId = interaction.options.getString("user-id", true);

        await collectionBlacklistUser().deleteOne(
            { userId: userId },
        );

        await interaction.reply(replyEmbedEphemeral("Removed user from blacklist.", EmbedType.Success));
    },
});

const upload_standard_cmd = new CommandGroup({
    name: "upload",
    description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
    commands: [
        new Command({
            name: "standard",
            description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
            options: [
                createStringOption("name", "Name for the sample", true),
            ],
            async func(interaction) {
                const name = interaction.options.getString("name", true);

                await upload(interaction, name, "standard");
            },
        }),
    ],
});

const delete_extern_cmd = new Command({
    name: "extern",
    description: "Delete a custom sample by id.",
    options: [
        createStringOption("id", "Id of the custom sample to delete.", true),
    ],
    async func(interaction) {
        const userId = interaction.user.id;

        const id = interaction.options.getString("id", true);

        if (!isOwner(userId)) {
            return await interaction.reply(replyEmbedEphemeral("You're not a bot developer, you can't just remove any sample.", EmbedType.Error));
        }

        if (!SampleID.isId(id)) {
            return await interaction.reply(replyEmbedEphemeral(`${id} is not a valid id.`, EmbedType.Error));
        }

        const sample = await CustomSample.findById(id);
        if (!sample) {
            return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with id ${id}`, EmbedType.Error));
        }

        await CustomSample.removeCompletely(sample);

        return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success));
    },
});

const delete_standard_cmd = new Command({
    name: "standard",
    description: "Delete a standard sample by name.",
    options: [
        createStringOption("name", "Name of the standard sample to delete.", true),
    ],
    async func(interaction) {
        const name = interaction.options.getString("name", true);

        await remove(interaction, name, "standard");
    },
});

const backup_cmd = new Command({
    name: "backup",
    description: "Backup the server.",
});

const reboot_cmd = new Command({
    name: "reboot",
    description: "Reboot the bot",
    async func(interaction) {
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply(replyEmbedEphemeral("You need to be a bot developer for that.", EmbedType.Error));
        }

        exit(interaction.client, 0);
    },
});

const owner_cmd = new TopCommandGroup({
    name: "owner",
    description: "A set of owner commands.",
    commands: [
        new CommandGroup({
            name: "blacklist",
            description: "Blacklist a user from using this bot.",
            commands: [
                blacklist_add_cmd,
                blacklist_remove_cmd,
            ],
        }),
        upload_standard_cmd,
        new CommandGroup({
            name: "delete",
            description: "Import a sample to standard soundboard.",
            commands: [
                delete_extern_cmd,
                delete_standard_cmd,
            ],
        }),
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
});
registry.addCommand(owner_cmd);
