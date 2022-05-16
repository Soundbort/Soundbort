import { SAMPLE_TYPES } from "../../const";

import { SlashSubCommandGroup } from "../../modules/commands/SlashSubCommandGroup";
import { SlashSubCommand } from "../../modules/commands/SlashSubCommand";
import { createAttachmentOption } from "../../modules/commands/options/attachment";
import { createStringOption } from "../../modules/commands/options/string";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

import { getLastAttachment, upload, UploadErrors } from "../../core/soundboard/methods/upload";

export default new SlashSubCommandGroup({
    name: "upload",
    description: "Upload an audio file and add it as a sample to the standard soundboard.",
    commands: [
        new SlashSubCommand({
            name: "standard",
            description: "Upload an audio file and add it as a sample to the standard soundboard.",
            options: [
                createStringOption({
                    name: "name",
                    description: "Name for the sample",
                    required: true,
                }),
                createAttachmentOption({
                    name: "audio-file",
                    description: "The audio you want to add as a sample. If missing, the lastest attachment in the chat will be used.",
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

                await interaction.deferReply();

                const name = interaction.options.getString("name", true).trim();
                // get attachment from command options. Fallback to the last attachment from the chat.
                const attachment = interaction.options.getAttachment("audio-file", false) ?? await getLastAttachment(interaction.channel);
                if (!attachment) {
                    return replyEmbedEphemeral(UploadErrors.FileMissing, EmbedType.Error);
                }

                for await (const status of upload(attachment, interaction.guild, interaction.user, name, SAMPLE_TYPES.STANDARD)) {
                    await interaction.editReply(status);
                }
            },
        }),
    ],
});
