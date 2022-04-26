import { SAMPLE_TYPES } from "../../const";

import { SlashSubCommandGroup } from "../../modules/commands/SlashSubCommandGroup";
import { SlashSubCommand } from "../../modules/commands/SlashSubCommand";
import { createStringOption } from "../../modules/commands/options/string";
import { replyEmbedEphemeral } from "../../util/builders/embed";

import { upload, UploadErrors } from "../../core/soundboard/methods/upload";

export default new SlashSubCommandGroup({
    name: "upload",
    description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
    commands: [
        new SlashSubCommand({
            name: "standard",
            description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
            options: [
                createStringOption({
                    name: "name",
                    description: "Name for the sample",
                    required: true,
                }),
            ],
            async func(interaction) {
                if (!interaction.inCachedGuild()) {
                    return replyEmbedEphemeral(UploadErrors.NotInGuild);
                }

                const name = interaction.options.getString("name", true).trim();

                await upload(interaction, name, SAMPLE_TYPES.STANDARD);
            },
        }),
    ],
});
