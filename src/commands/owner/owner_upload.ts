import { SAMPLE_TYPES } from "../../const";

import { SlashSubCommandGroup } from "../../modules/commands/SlashSubCommandGroup";
import { SlashSubCommand } from "../../modules/commands/SlashSubCommand";
import { createStringOption } from "../../modules/commands/options/string";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

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
                    return replyEmbedEphemeral(UploadErrors.NotInGuild, EmbedType.Error);
                }
                // weird error. Probably caching with DM channels
                // channelId tho is not null
                if (!interaction.channel) {
                    return replyEmbedEphemeral(UploadErrors.NoChannel, EmbedType.Error);
                }

                const name = interaction.options.getString("name", true).trim();

                await interaction.deferReply();

                const { guild, channel, user } = interaction;

                for await (const status of upload(guild, channel, user, name, SAMPLE_TYPES.STANDARD)) {
                    await interaction.editReply(status);
                }
            },
        }),
    ],
});
