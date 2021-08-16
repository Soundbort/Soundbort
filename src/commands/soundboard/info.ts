import Discord from "discord.js";

import { EmbedType, replyEmbedEphemeral } from "../../util/util";

import InteractionRegistry from "../../core/InteractionRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";

import SampleID from "../../core/soundboard/SampleID";
import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import { PredefinedSample } from "../../core/soundboard/sample/PredefinedSample";
import GuildConfigManager from "../../core/GuildConfigManager";

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

InteractionRegistry.addCommand(new TopCommand({
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
            return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
        }

        const show_delete = sample instanceof CustomSample &&
            // has sample in user soundboard?
            (sample.isInUsers(interaction.user.id) ||
            (!interaction.guildId || (
                // has sample in server soundboard?
                sample.isInGuilds(interaction.guildId) &&
                interaction.guild &&
                // is a moderator? can remove sample?
                await GuildConfigManager.isModerator(interaction.guild, interaction.user.id))
            ));

        return sample.toEmbed({ show_timestamps: true, show_delete: !!show_delete });
    },
}));
