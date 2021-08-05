import Discord from "discord.js";
import moment from "moment";

import { createEmbed, EmbedType, replyEmbedEphemeral } from "../../util/util";

import registry from "../../core/CommandRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";

import SampleID from "../../core/soundboard/SampleID";
import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import { PredefinedSample } from "../../core/soundboard/sample/PredefinedSample";

async function findSampleByScope(
    guildId: Discord.Snowflake | null,
    userId: Discord.Snowflake,
    name: string,
    scope: "user" | "server" | null,
): Promise<CustomSample | PredefinedSample | undefined> {
    let sample: CustomSample | PredefinedSample | undefined;
    if (!scope) {
        sample = await CustomSample.findByName(guildId, userId, name) ||
                 await PredefinedSample.findByName(name);
    } else if (scope === "user") {
        sample = await CustomSample.findSampleUser(userId, name);
    } else if (guildId) {
        sample = await CustomSample.findSampleGuild(guildId, name);
    }

    if (!sample && SampleID.isId(name)) {
        sample = await CustomSample.findById(name);
    }

    return sample;
}

function createInfoEmbed(sample: CustomSample | PredefinedSample): Discord.MessageEmbed {
    const embed = createEmbed();

    embed.addField("Name", sample.name, true);
    if ("id" in sample) embed.addField("ID", sample.id, true);

    embed.addField("Play Count", sample.plays.toLocaleString("en"));

    embed.addField("Uploaded", moment(sample.created_at).fromNow(), true);
    embed.addField("Modified", moment(sample.modified_at).fromNow(), true);
    if (sample.last_played_at) embed.addField("Last Played", moment(sample.last_played_at).fromNow(), true);

    embed.addField("Importable", sample.importable ? "✅" : "❌", true);

    return embed;
}

registry.addCommand(new TopCommand({
    name: "info",
    description: "Display information about a sample.",
    options: [
        createStringOption("sample", "A sample name or sample identifier (sXXXXXX)", true),
        createStringOption("from", "In case user, server or standard samples have the same name.", false, [
            createChoice("Only search server samples.", "server"),
            createChoice("Only search your user samples.", "user"),
        ]),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true);
        const scope = interaction.options.getString("from", false) as ("user" | "server" | null);

        const sample = await findSampleByScope(interaction.guildId, interaction.user.id, name, scope);
        if (!sample) {
            return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error));
        }

        await interaction.reply({ embeds: [createInfoEmbed(sample)], ephemeral: true });
    },
}));
