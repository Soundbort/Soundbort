import { SAMPLE_TYPES } from "../../const";

import { CmdInstallerArgs } from "../../util/types";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createChoice } from "../../modules/commands/choice";
import { createStringOption } from "../../modules/commands/options/string";
import { replyEmbedEphemeral } from "../../util/builders/embed";

import { upload, UploadErrors } from "../../core/soundboard/methods/upload";

export function install({ registry, admin }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "upload",
        description: "Add a sound sample to your soundboard. Upload the audio file first, then call this command.",
        options: [
            createStringOption({
                name: "name",
                description: "Name for the sample",
                required: true,
            }),
            createStringOption({
                name: "to",
                description: "Choose the soundboard to add the sound to. Defaults to your personal soundboard.",
                choices: [
                    createChoice("Upload into your personal soundboard.", SAMPLE_TYPES.USER),
                    createChoice("Upload into server soundboard for every member to use.", SAMPLE_TYPES.SERVER),
                ],
            }),
        ],
        permissions: SlashCommandPermissions.EVERYONE,
        async func(interaction) {
            if (!interaction.inCachedGuild()) {
                return replyEmbedEphemeral(UploadErrors.NotInGuild);
            }

            const name = interaction.options.getString("name", true).trim();
            const scope = interaction.options.getString("to", false) as (SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | null) || SAMPLE_TYPES.USER;

            await upload(admin, interaction, name, scope);
        },
    }));
}
