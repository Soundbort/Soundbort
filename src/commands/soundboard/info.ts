import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

import InteractionRegistry from "../../core/InteractionRegistry";
import { CommandStringOption } from "../../modules/commands/CommandOption";
import { TopCommand } from "../../modules/commands/TopCommand";

import { CustomSample } from "../../core/soundboard/CustomSample";
import GuildConfigManager from "../../core/managers/GuildConfigManager";
import { search } from "../../core/soundboard/methods/searchMany";
import { findOne } from "../../core/soundboard/methods/findOne";

InteractionRegistry.addCommand(new TopCommand({
    name: "info",
    description: "Display information about a sample.",
    options: [
        new CommandStringOption({
            name: "sample",
            description: "A sample name or sample identifier (sXXXXXX)",
            required: true,
            async autocomplete(value, interaction) {
                return await search(value, interaction.user.id, interaction.guild);
            },
        }),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true).trim();

        const sample = await findOne(name, interaction.user.id, interaction.guildId);
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
