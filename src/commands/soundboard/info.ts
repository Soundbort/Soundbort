import { CmdInstallerArgs } from "../../util/types.js";
import { SlashCommand } from "../../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions.js";
import { createStringOption } from "../../modules/commands/options/string.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";

import { search } from "../../core/soundboard/methods/searchMany.js";
import { findOne } from "../../core/soundboard/methods/findOne.js";

export function install({ registry, admin }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "info",
        description: "Display information about a sample.",
        options: [
            createStringOption({
                name: "sample",
                description: "A sample name or sample identifier (sXXXXXX)",
                required: true,
                autocomplete: (name, interaction) => search({
                    admin,
                    name,
                    userId: interaction.user.id,
                    guild: interaction.guild,
                }),
            }),
        ],
        permissions: SlashCommandPermissions.EVERYONE,
        async func(interaction) {
            const name = interaction.options.getString("sample", true).trim();

            const sample = await findOne(name, interaction.user.id, interaction.guildId);
            if (!sample) {
                return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
            }

            const show_delete = await admin.canDeleteSample(sample, interaction.user.id, interaction.guild);

            return await sample.toEmbed({ show_timestamps: true, show_delete: !!show_delete });
        },
    }));
}
