import Discord from "discord.js";

import registry from "../../core/CommandRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { CmdInstallerArgs } from "../../util/types";
import { collectionBlacklistUser } from "../../modules/database/models";
import { EmbedType, replyEmbedEphemeral } from "../../util/util";
import { BUTTON_IDS } from "../../const";
import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import GuildConfigManager from "../../core/GuildConfigManager";

async function importUser(interaction: Discord.ButtonInteraction | Discord.CommandInteraction, sample: CustomSample) {
    const user = interaction.user;

    if (await CustomSample.findSampleUser(user.id, sample.name)) {
        return await interaction.reply(replyEmbedEphemeral("You already have a sample with this name in your soundboard.", EmbedType.Error));
    }

    await CustomSample.import(user, sample);

    await interaction.reply(sample.toEmbed({ description: `Successfully imported sample "${sample.name}."`, type: EmbedType.Success }));
}

async function importServer(interaction: Discord.ButtonInteraction | Discord.CommandInteraction, sample: CustomSample) {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guildId || !guild) {
        return await interaction.reply(replyEmbedEphemeral("You're not in a server.", EmbedType.Error));
    }

    if (!await GuildConfigManager.isModerator(guild, user.id)) {
        return await interaction.reply(replyEmbedEphemeral("You're not a moderator of this server, you can't remove server samples.", EmbedType.Error));
    }

    if (await CustomSample.findSampleGuild(guildId, sample.name)) {
        return await interaction.reply(replyEmbedEphemeral("You already have a sample with this name in your soundboard.", EmbedType.Error));
    }

    await CustomSample.import(guild, sample);

    await interaction.reply(sample.toEmbed({ description: `Successfully imported sample "${sample.name}."`, type: EmbedType.Success }));
}

registry.addCommand(new TopCommand({
    name: "import",
    description: "Import a sample from another user or server to your or your server's soundboard.",
    options: [
        createStringOption("sample_id", "A sample identifier (sXXXXXX). Get the ID of a sample from typing `/info <name>`.", true),
        createStringOption("to", "Choose the soundboard to import the sound to. Defaults to your personal soundboard.", false, [
            createChoice("Import into your personal soundboard.", "user"),
            createChoice("Import into server soundboard for every member to use.", "server"),
        ]),
    ],
    async func(interaction) {
        const id = interaction.options.getString("sample_id", true);
        const scope = interaction.options.getString("to", false) as ("user" | "server" | null) || "user";

        const sample = await CustomSample.findById(id);
        if (!sample) {
            return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with id ${id}`, EmbedType.Error));
        }

        if (!sample.importable) {
            return await interaction.reply(replyEmbedEphemeral("This sample is marked as not importable.", EmbedType.Error));
        }

        if (scope === "user") await importUser(interaction, sample);
        else await importServer(interaction, sample);
    },
}));

export function install({ client }: CmdInstallerArgs): void {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isButton()) return;
        if (!interaction.inGuild()) return;

        if (await collectionBlacklistUser().findOne({ userId: interaction.user.id })) {
            return await interaction.reply(replyEmbedEphemeral("You're blacklisted from using this bot anywhere.", EmbedType.Error));
        }

        const customId = interaction.customId;
        if (customId.startsWith(BUTTON_IDS.IMPORT_USER)) {
            const id = customId.substring(BUTTON_IDS.IMPORT_USER.length);

            const sample = await CustomSample.findById(id);
            if (!sample) return;

            return await importUser(interaction, sample);
        }
        if (customId.startsWith(BUTTON_IDS.IMPORT_SERVER)) {
            const id = customId.substring(BUTTON_IDS.IMPORT_SERVER.length);

            const sample = await CustomSample.findById(id);
            if (!sample) return;

            return await importServer(interaction, sample);
        }
    });
}
