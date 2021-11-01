import Discord from "discord.js";
import { SAMPLE_TYPES } from "../../const";

import InteractionRegistry from "../../core/InteractionRegistry";
import { CommandStringOption } from "../../modules/commands/CommandOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

import SampleID from "../../core/soundboard/SampleID";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";
import GuildConfigManager from "../../core/managers/GuildConfigManager";

async function findSampleByScope(
    guildId: Discord.Snowflake | null,
    userId: Discord.Snowflake,
    name: string,
    scope: "user" | "server" | null,
): Promise<CustomSample | StandardSample | undefined> {
    let sample: CustomSample | StandardSample | undefined;
    if (!scope) {
        sample = await CustomSample.findByName(guildId, userId, name) ||
                 await StandardSample.findByName(name);
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
        new CommandStringOption({
            name: "sample",
            description: "A sample name or sample identifier (sXXXXXX)",
            required: true,
        }),
        new CommandStringOption({
            name: "from",
            description: "In case user, server or standard samples have the same name.",
            choices: [
                createChoice("Only search server samples.", SAMPLE_TYPES.SERVER),
                createChoice("Only search your user samples.", SAMPLE_TYPES.USER),
            ],
        }),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true).trim();
        const scope = interaction.options.getString("from", false) as (SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | null);

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
