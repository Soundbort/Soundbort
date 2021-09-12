/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { promisify } from "util";
import path from "path";
import temp from "temp";
import fs from "fs-extra";
import Discord from "discord.js";
import ffmpeg, { ffprobe as _ffprobe, FfprobeData } from "fluent-ffmpeg";

import Logger from "../../../log";
import { downloadFile, isEnoughDiskSpace } from "../../../util/files";

import SampleID from "../SampleID";
import { CustomSample } from "../CustomSample";
import { StandardSample } from "../StandardSample";
import { isOwner, logErr } from "../../../util/util";
import { EmbedType, replyEmbed } from "../../../util/builders/embed";
import GuildConfigManager from "../../managers/GuildConfigManager";

const ffprobe = promisify(_ffprobe) as (file: string) => Promise<FfprobeData>;

const log = Logger.child({ label: "Sample => Uploader" });

export const MAX_LEN_NAME = 30;
export const MAX_SIZE = 4;
export const MAX_DURATION = 30 * 1_000;

export const UploadErrors = {
    OutOfSpace: "Disk space is running out. Please inform the developer.",
    NotInGuild: "You can't upload samples to a server when you're not calling this command from a server.",
    NotOwner: "Only bot developers can add standard samples.",
    NotModerator: "You can't upload a sample to this server, because you don't have the permissions.",
    TooManySamples: "You have filled all your sample slots ({MAX_SAMPLES}). Try deleting some or type `/vote` to get more slots before you can add more.",
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

    const failed = (desc: string) => interaction.editReply(replyEmbed(desc, EmbedType.Error));
    const status = (desc: string) => interaction.editReply(replyEmbed(desc, EmbedType.Basic, "🔄"));

    if (!await isEnoughDiskSpace()) {
        return await failed(UploadErrors.OutOfSpace);
    }

    const userId = interaction.user.id;

    if (scope === "server") {
        if (!interaction.inGuild()) {
            return await failed(UploadErrors.NotInGuild);
        }

        if (!interaction.guild || !await GuildConfigManager.isModerator(interaction.guild, userId)) {
            return await failed(UploadErrors.NotModerator);
        }
    }

    if (scope === "standard" && !isOwner(userId)) {
        return await failed(UploadErrors.NotOwner);
    }

    const guildId = interaction.guildId!;

    // is soundboard full?
    if (scope === "standard") {
        const sample_count = await StandardSample.countSamples();
        if (sample_count >= StandardSample.MAX_SLOTS) {
            return await failed(UploadErrors.TooManySamples.replace("{MAX_SAMPLES}", StandardSample.MAX_SLOTS.toLocaleString("en")));
        }
    } else {
        let sample_count: number;
        switch (scope) {
            case "user": sample_count = await CustomSample.countUserSamples(userId); break;
            case "server": sample_count = await CustomSample.countGuildSamples(guildId); break;
        }

        const slot_count = await CustomSample.countSlots(scope === "user" ? userId : guildId);
        if (sample_count >= slot_count) {
            return await failed(UploadErrors.TooManySamples.replace("{MAX_SAMPLES}", slot_count.toLocaleString("en")));
        }
    }

    // weird error. Probably caching with DM channels
    // channelId tho is not null
    const channel = interaction.channel;
    if (!channel) {
        return await failed(UploadErrors.NoChannel);
    }

    // /////////// ATTACHMENT CHECKS ///////////

    await status("Checking data...");

    const messages = await channel.messages.fetch({ limit: 10 });

    const message = messages
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .find(msg => msg.attachments.size > 0);

    // Does message with attachment exist?
    if (!message) {
        return await failed(UploadErrors.FileMissing);
    }

    const attachment = message.attachments.first() as Discord.MessageAttachment;

    if (attachment.contentType && attachment.contentType.split("/")[0] !== "audio") {
        return await failed(UploadErrors.UnsupportedType);
    }

    const extname = attachment.name ? path.extname(attachment.name) : undefined;

    if (attachment.size > 1000 * 1000 * MAX_SIZE) {
        return await failed(UploadErrors.TooLarge);
    }

    // /////////// NAME CHECKS ///////////

    name = name.trim();

    if (!name || name === "") {
        return await failed(UploadErrors.NameMissing);
    }

    if (name.length > MAX_LEN_NAME) {
        return await failed(UploadErrors.NameOutOfRange);
    }

    if (!/^[a-zA-Z0-9 .,_-]*$/.test(name)) {
        return await failed(UploadErrors.InvalidName);
    }

    let name_exists = false;
    switch (scope) {
        case "user": name_exists = !!await CustomSample.findSampleUser(userId, name); break;
        case "server": name_exists = !!await CustomSample.findSampleGuild(guildId, name); break;
        case "standard": name_exists = !!await StandardSample.findByName(name); break;
    }
    if (name_exists) {
        return await failed(UploadErrors.NameExists);
    }

    // /////////// DOWNLOADING FILE ///////////

    await status("Downloading file...");

    const temp_raw_file = temp.path({
        prefix: "sample_download_",
        suffix: extname,
    });

    try {
        await downloadFile(attachment.url, temp_raw_file);
    } catch {
        return await failed(UploadErrors.DownloadFailed);
    }

    // /////////// CHECKING FILE ///////////

    await status("Checking file data...");

    try {
        const data = await ffprobe(temp_raw_file);

        if (!data.streams.some(stream => stream.codec_type === "audio" && stream.channels)) {
            return await failed(UploadErrors.NoStreams);
        }

        const duration = data.format.duration;
        // if duration undefined and duration === 0
        if (!duration) {
            return await failed(UploadErrors.NoDuration);
        }

        if (duration * 1000 > MAX_DURATION) {
            return await failed(UploadErrors.TooLong);
        }
    } catch (error) {
        log.debug({ error: logErr(error) });
        return await failed(UploadErrors.FfProbeError);
    }

    // /////////// CONVERTING FILE ///////////

    await status("Converting and optimizing sound file...");

    const temp_conversion_file = temp.path({
        prefix: "sample_conversion_",
        suffix: CustomSample.EXT,
    });

    try {
        await convertAudio(temp_raw_file, temp_conversion_file);
    } catch (error) {
        log.debug({ error: logErr(error) });
        return await failed(UploadErrors.ConversionError);
    }

    let sample_file: string;
    let new_id: string | undefined;

    if (scope !== "standard") {
        new_id = await generateId();

        if (!new_id) {
            return await failed(UploadErrors.IdGeneration);
        }

        sample_file = CustomSample.generateFilePath(new_id);

        await CustomSample.ensureDir();
    } else {
        sample_file = StandardSample.generateFilePath(name);

        await StandardSample.ensureDir();
    }

    await fs.move(temp_conversion_file, sample_file);

    // /////////// FINISHING UP ///////////

    await status("Saving to database and finishing up...");

    let sample: CustomSample | StandardSample;

    if (scope !== "standard") {
        sample = await CustomSample.create({
            scope: scope,
            id: new_id!,
            name: name,
            orig_filename: attachment.name || undefined,
            creatorId: scope === "user" ? userId : guildId,
            userIds: scope === "user" ? [userId] : [],
            guildIds: scope === "server" ? [guildId] : [],
            plays: 0,
            created_at: new Date(),
            modified_at: new Date(),
        });
    } else {
        sample = await StandardSample.create({
            name: name,
            orig_filename: attachment.name || undefined,
            plays: 0,
            created_at: new Date(),
            modified_at: new Date(),
        });
    }

    await interaction.editReply(sample.toEmbed({ show_timestamps: false, description: "Successfully added!", type: EmbedType.Success }));
}

export async function upload(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<any> {
    try {
        await _upload(interaction, name, scope);
    } catch (error) {
        log.debug({ error: logErr(error) });
        await interaction.editReply(replyEmbed(UploadErrors.General, EmbedType.Error));
    } finally {
        await temp.cleanup();
    }
}
