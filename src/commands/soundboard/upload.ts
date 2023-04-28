import { SAMPLE_TYPES } from "../../const.js";

import { CmdInstallerArgs } from "../../util/types.js";
import { SlashCommand } from "../../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions.js";
import { createChoice } from "../../modules/commands/choice/index.js";
import { createAttachmentOption } from "../../modules/commands/options/attachment.js";
import { createStringOption } from "../../modules/commands/options/string.js";
import { replyEmbedEphemeral, replyEmbed, EmbedType } from "../../util/builders/embed.js";

import { getLastAttachment, upload, UploadErrors } from "../../core/soundboard/methods/upload.js";

export function install({ registry, admin }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "upload",
        description: "Upload an audio file and add it as a sample to your soundboard.",
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
                return replyEmbedEphemeral(UploadErrors.NotInGuild, EmbedType.Error);
            }
            // weird error. Probably caching with DM channels
            // channelId tho is not null
            if (!interaction.channel) {
                return replyEmbedEphemeral(UploadErrors.NoChannel, EmbedType.Error);
            }

            await interaction.deferReply();

            const name = interaction.options.getString("name", true).trim();
            const scope = interaction.options.getString("to", false) as (SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | null) || SAMPLE_TYPES.USER;
            // get attachment from command options. Fallback to the last attachment from the chat.
            const attachment = interaction.options.getAttachment("audio-file", false) ?? await getLastAttachment(interaction.channel);
            if (!attachment) {
                return replyEmbedEphemeral(UploadErrors.FileMissing, EmbedType.Error);
            }

            if (scope === SAMPLE_TYPES.SERVER && !await admin.isAdmin(interaction.guild, interaction.user.id)) {
                return replyEmbed(UploadErrors.NotModerator, EmbedType.Error);
            }

            for await (const status of upload(attachment, interaction.guild, interaction.user, name, scope)) {
                await interaction.editReply(status);
            }
        },
    }));
}
