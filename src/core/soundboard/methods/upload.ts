/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { promisify } from "util";
import path from "path";
import temp from "temp";
import Discord from "discord.js";
import ffmpeg, { ffprobe as _ffprobe, FfprobeData } from "fluent-ffmpeg";

import Logger from "../../../log";
import { downloadFile, isEnoughDiskSpace } from "../../../util/files";

import SampleID from "../SampleID";
import { CustomSample } from "../sample/CustomSample";
import { PredefinedSample } from "../sample/PredefinedSample";
import { EmbedType, isOwner, replyEmbed } from "../../../util/util";
import GuildConfigManager from "../../GuildConfigManager";

const ffprobe = promisify(_ffprobe) as (file: string) => Promise<FfprobeData>;

const log_upload = Logger.child({ label: "Sample => Uploader" });

// could be 25, but limit to 10 first, so that users can later vote to get more sample slots
// export const MAX_SAMPLES = 25;
export const MAX_SAMPLES = 10;
export const MAX_LEN_NAME = 30;
export const MAX_SIZE = 4;
export const MAX_DURATION = 30 * 1_000;

export const UploadErrors = {
    OutOfSpace: "Disk space is running out. Please inform the developer.",
    NotInGuild: "You can't upload samples to a server when you're not calling this command from a server.",
    NotOwner: "Only bot developers can add standard samples.",
    NotModerator: "You can't upload a sample to this server, because you don't have the permissions.",
    TooManySamples: `You can't add any more samples (max ${MAX_SAMPLES}). Try deleting some before you can add more.`,
    NoChannel: "Weirdly enough this channel was not cached.",
    FileMissing: "Upload an audio file first, then call this command.",
    UnsupportedType: "The file is not an audio file. Please upload an audio file and then call this command.",
    TooLarge: `The file is too big! Please keep it below ${MAX_SIZE} MB and ${MAX_DURATION / 1000} seconds. Even WAV can do that.`,
    NameMissing: "The name cannot be empty.",
    NameOutOfRange: `The name can't be longer than ${MAX_LEN_NAME} characters.`,
    InvalidName: "Please only use common characters A-Z, 0-9, .,_- in sound sample names ;c;",
    NameExists: "You already have a sound clip with that name in this soundboard.",
    DownloadFailed: "Failed downloading the file from Discord's servers. Try it again later or contant the developer if this continues.",
    NoStreams: "Couldn't read any valid streams from the file. Try another.",
    NoDuration: "Couldn't parse any duration from the audio file. Try another.",
    FfProbeError: "Checking file integrity failed. Try another.",
    TooLong: `The sound clip cannot be longer than ${(MAX_DURATION / 1000).toFixed(1)} seconds.`,
    IdGeneration: "Unique ID couldn't be created. Try again later?",
    ConversionError: "The file couldn't be converted to a supported format. Try another.",
    General: "Something must've gone horribly wrong. Try again later or contact the developer.",
};

function convertAudio(input: string, output: string): Promise<void> {
    return new Promise<void>((res, rej) => {
        ffmpeg(input)
            .audioFilter("silenceremove=1:0:-50dB")
            .audioCodec("libopus")
            .audioBitrate("96k")
            .audioFrequency(48000)
            .audioChannels(2)
            .output(output)
            .once("end", res)
            .once("error", rej)
            .run();
    });
}

async function generateId() {
    let pending = 5;
    while (pending-- >= 0) {
        const id = SampleID.generate();
        const exists = await CustomSample.findById(id);
        if (!exists) return id;
    }
}

async function _upload(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<any> {
    await interaction.deferReply();

    if (!await isEnoughDiskSpace()) {
        return await interaction.editReply(replyEmbed(UploadErrors.OutOfSpace, EmbedType.Error));
    }

    const userId = interaction.user.id;

    if (scope === "server") {
        if (!interaction.inGuild()) {
            return await interaction.editReply(replyEmbed(UploadErrors.NotInGuild, EmbedType.Error));
        }

        if (!interaction.guild || !await GuildConfigManager.isModerator(interaction.guild, userId)) {
            return await interaction.editReply(replyEmbed(UploadErrors.NotModerator, EmbedType.Error));
        }
    }

    if (scope === "standard" && !isOwner(userId)) {
        return await interaction.editReply(replyEmbed(UploadErrors.NotOwner, EmbedType.Error));
    }

    const guildId = interaction.guildId;

    // is soundboard full?
    let sample_count: number;
    switch (scope) {
        case "user": sample_count = await CustomSample.countUserSamples(userId); break;
        case "server": sample_count = await CustomSample.countGuildSamples(guildId!); break;
        case "standard": sample_count = await PredefinedSample.countSamples(); break;
    }

    if (sample_count >= MAX_SAMPLES) {
        return await interaction.editReply(replyEmbed(UploadErrors.TooManySamples, EmbedType.Error));
    }

    // weird error. Probably caching with DM channels
    // channelId tho is not null
    const channel = interaction.channel;
    if (!channel) {
        return await interaction.editReply(replyEmbed(UploadErrors.NoChannel, EmbedType.Error));
    }

    // /////////// ATTACHMENT CHECKS ///////////

    await interaction.editReply(replyEmbed("🔄 Checking data...", EmbedType.Basic));

    const messages = await channel.messages.fetch({ limit: 10 });

    const message = messages
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .find(msg => msg.attachments.size > 0);

    // Does message with attachment exist?
    if (!message) {
        return await interaction.editReply(replyEmbed(UploadErrors.FileMissing, EmbedType.Error));
    }

    const attachment = message.attachments.first() as Discord.MessageAttachment;

    if (attachment.contentType && attachment.contentType.split("/")[0] !== "audio") {
        return await interaction.editReply(replyEmbed(UploadErrors.UnsupportedType, EmbedType.Error));
    }

    const extname = attachment.name ? path.extname(attachment.name) : undefined;

    if (attachment.size > 1000 * 1000 * MAX_SIZE) {
        return await interaction.editReply(replyEmbed(UploadErrors.TooLarge, EmbedType.Error));
    }

    // /////////// NAME CHECKS ///////////

    if (!name || name === "") {
        return await interaction.editReply(replyEmbed(UploadErrors.NameMissing, EmbedType.Error));
    }

    if (name.length > MAX_LEN_NAME) {
        return await interaction.editReply(replyEmbed(UploadErrors.NameOutOfRange, EmbedType.Error));
    }

    if (!/^[a-zA-Z0-9 .,_-]*$/.test(name)) {
        return await interaction.editReply(replyEmbed(UploadErrors.InvalidName, EmbedType.Error));
    }

    let name_exists = false;
    switch (scope) {
        case "user": name_exists = !!await CustomSample.findSampleUser(userId, name); break;
        case "server": name_exists = !!await CustomSample.findSampleGuild(guildId!, name); break;
        case "standard": name_exists = !!await PredefinedSample.findByName(name); break;
    }
    if (name_exists) {
        return await interaction.editReply(replyEmbed(UploadErrors.NameExists, EmbedType.Error));
    }

    // /////////// DOWNLOADING FILE ///////////

    await interaction.editReply(replyEmbed("🔄 Downloading file...", EmbedType.Basic));

    const temp_file = temp.path({
        prefix: "sample_download_",
        suffix: extname,
    });

    try {
        await downloadFile(attachment.url, temp_file);
    } catch {
        return await interaction.editReply(replyEmbed(UploadErrors.DownloadFailed, EmbedType.Error));
    }

    // /////////// CHECKING FILE ///////////

    await interaction.editReply(replyEmbed("🔄 Checking file data...", EmbedType.Basic));

    try {
        const data = await ffprobe(temp_file);

        if (!data.streams.some(stream => stream.codec_type === "audio" && stream.channels)) {
            return await interaction.editReply(replyEmbed(UploadErrors.NoStreams, EmbedType.Error));
        }

        const duration = data.format.duration;
        // if duration undefined and duration === 0
        if (!duration) {
            return await interaction.editReply(replyEmbed(UploadErrors.NoDuration, EmbedType.Error));
        }

        if (duration * 1000 > MAX_DURATION) {
            return await interaction.editReply(replyEmbed(UploadErrors.TooLong, EmbedType.Error));
        }
    } catch (error) {
        log_upload.debug({ error });
        return await interaction.editReply(replyEmbed(UploadErrors.FfProbeError, EmbedType.Error));
    }

    // /////////// CONVERTING FILE ///////////

    await interaction.editReply(replyEmbed("🔄 Converting and optimizing sound file...", EmbedType.Basic));

    let sample_file: string;
    let new_id: string | undefined;

    if (scope !== "standard") {
        new_id = await generateId();

        if (!new_id) {
            return await interaction.editReply(replyEmbed(UploadErrors.IdGeneration, EmbedType.Error));
        }

        sample_file = CustomSample.generateFilePath(new_id);

        await CustomSample.ensureDir();
    } else {
        sample_file = PredefinedSample.generateFilePath(name);

        await PredefinedSample.ensureDir();
    }

    try {
        await convertAudio(temp_file, sample_file);
    } catch (error) {
        log_upload.debug({ error });
        return await interaction.editReply(replyEmbed(UploadErrors.ConversionError, EmbedType.Error));
    }

    await interaction.editReply(replyEmbed("🔄 Saving to database and finishing up...", EmbedType.Basic));

    if (scope !== "standard") {
        await CustomSample.create({
            scope: scope,
            id: new_id!,
            name: name,
            orig_filename: attachment.name || undefined,
            creatorId: scope === "user" ? userId : guildId!,
            userIds: scope === "user" ? [userId] : [],
            guildIds: scope === "server" ? [guildId!] : [],
            plays: 0,
            created_at: new Date(),
            modified_at: new Date(),
        });
    } else {
        await PredefinedSample.create({
            name: name,
            orig_filename: attachment.name || undefined,
            plays: 0,
            created_at: new Date(),
            modified_at: new Date(),
        });
    }

    await interaction.editReply(replyEmbed("Successfully added!", EmbedType.Success));
}

export async function upload(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<any> {
    try {
        await _upload(interaction, name, scope);
    } catch (error) {
        log_upload.debug({ error });
        await interaction.editReply(replyEmbed(UploadErrors.General, EmbedType.Error));
    } finally {
        await temp.cleanup();
    }
}

export default {
    MAX_SAMPLES,
    MAX_LEN_NAME,
    MAX_SIZE,
    MAX_DURATION,
    UploadErrors,
    upload,
};
