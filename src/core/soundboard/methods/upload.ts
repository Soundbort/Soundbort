import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import path from "node:path";
import temp from "temp";
import fs from "fs-extra";
import * as Discord from "discord.js";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";

import { SAMPLE_TYPES } from "../../../const.js";
import Logger from "../../../log.js";
import { downloadFile, isEnoughDiskSpace } from "../../../util/files.js";

import SampleID from "../SampleID.js";
import { CustomSample } from "../CustomSample.js";
import { StandardSample } from "../StandardSample.js";
import { EmbedType, replyEmbed } from "../../../util/builders/embed.js";

const ffprobe = promisify(ffmpeg.ffprobe) as (file: string) => Promise<FfprobeData>;

const log = Logger.child({ label: "Sample => Uploader" });

/**
 * Fetch the last attachment from the chat.
 */
export async function getLastAttachment(channel: Discord.GuildTextBasedChannel) {
    const messages = await channel.messages.fetch({ limit: 10 });

    const message = messages
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .find(msg => msg.attachments.size > 0);

    return message?.attachments.first();
}

export const MAX_LEN_NAME = 30;
export const MAX_SIZE = 8;
export const MAX_DURATION = 30 * 1000;

export const UploadErrors = {
    OutOfSpace: "Disk space is running out. Please inform the developer.",
    NotInGuild: "You can't upload samples to a server when you're not calling this command from a server.",
    NotModerator: "You can't upload a sample to this server, because you don't have the permissions.",
    TooManySamples: "You have filled all your sample slots ({MAX_SAMPLES}). Try deleting some or type `/vote` to get more slots before you can add more.",
    NoChannel: "Weirdly enough this channel was not cached.",
    FileMissing: "Upload an audio file with the command with the 'audio-file' option, or upload it to the chat and then call this command.",
    UnsupportedType: "The file is not an audio file. Please upload an audio file (mp3, ogg, wav etc...).",
    TooLarge: `The file is too big! Please keep it below ${MAX_SIZE} MB and ${MAX_DURATION / 1000} seconds. Even WAV can do that.`,
    NameMissing: "The name cannot be empty.",
    NameOutOfRange: `The name can't be longer than ${MAX_LEN_NAME} characters.`,
    InvalidName: "Please only use common characters A-Z, 0-9, .,_- in sound sample names ;c;",
    NameExists: "You already have a sound clip with that name in this soundboard.",
    DownloadFailed: "Failed downloading the file from Discord's servers. Try it again later or contact the developer if this continues.",
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
            .audioBitrate(96)
            .audioFrequency(48_000)
            .audioChannels(2)
            .addOutputOption("-map 0:a:0") // only first input audio stream
            .addOutputOption("-map_metadata -1") // strip all metadata from input
            .output(output)
            .once("end", res)
            .once("error", rej)
            .run();
    });
}

async function generateId(retries: number = 5) {
    while (retries-- >= 0) {
        const id = SampleID.generate();
        const exists = await CustomSample.findById(id);
        if (!exists) return id;
    }
}

async function failed(desc: string) {
    await temp.cleanup();
    return replyEmbed(desc, EmbedType.Error);
}
function status(desc: string) {
    return replyEmbed(desc, EmbedType.Basic, "🔄");
}

/**
 * Upload a sample. Permission checks are NOT done.
 *
 * @param guild The guild the sample is uploaded to
 * @param channel The channel the command is invoked from (for getting attachment)
 * @param user The user the sample is uploaded to
 * @param name The name of the sample
 * @param scope The type of soundboard the sample is uploaded to
 * @returns A generator that yields {@link Discord.InteractionReplyOptions} for
 *          every step and error during upload.
 */
export async function* upload(
    attachment: Discord.Attachment,
    guild: Discord.Guild,
    user: Discord.User,
    name: string,
    scope: SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER | SAMPLE_TYPES.STANDARD,
): AsyncGenerator<Discord.InteractionReplyOptions, void, void> {
    try {
        if (!await isEnoughDiskSpace()) {
            return yield failed(UploadErrors.OutOfSpace);
        }

        // is soundboard full?
        if (scope === SAMPLE_TYPES.STANDARD) {
            const sample_count = await StandardSample.countSamples();
            if (sample_count >= StandardSample.MAX_SLOTS) {
                return yield failed(UploadErrors.TooManySamples.replace("{MAX_SAMPLES}", StandardSample.MAX_SLOTS.toLocaleString("en")));
            }
        } else {
            let sample_count: number;
            switch (scope) {
                case SAMPLE_TYPES.USER: sample_count = await CustomSample.countUserSamples(user.id); break;
                case SAMPLE_TYPES.SERVER: sample_count = await CustomSample.countGuildSamples(guild.id); break;
            }

            const slot_count = await CustomSample.countSlots(scope === SAMPLE_TYPES.USER ? user.id : guild.id);
            if (sample_count >= slot_count) {
                return yield failed(UploadErrors.TooManySamples.replace("{MAX_SAMPLES}", slot_count.toLocaleString("en")));
            }
        }

        // /////////// ATTACHMENT CHECKS ///////////

        yield status("Checking data...");

        if (attachment.contentType && attachment.contentType.split("/")[0] !== "audio") {
            return yield failed(UploadErrors.UnsupportedType);
        }

        const extname = attachment.name ? path.extname(attachment.name) : undefined;

        if (attachment.size > 1000 * 1000 * MAX_SIZE) {
            return yield failed(UploadErrors.TooLarge);
        }

        // /////////// NAME CHECKS ///////////

        name = name.trim();

        if (!name || name === "") {
            return yield failed(UploadErrors.NameMissing);
        }

        if (name.length > MAX_LEN_NAME) {
            return yield failed(UploadErrors.NameOutOfRange);
        }

        if (!/^[\w ,.-]*$/.test(name)) {
            return yield failed(UploadErrors.InvalidName);
        }

        let name_exists = false;
        switch (scope) {
            case SAMPLE_TYPES.USER: name_exists = !!await CustomSample.findSampleUser(user.id, name); break;
            case SAMPLE_TYPES.SERVER: name_exists = !!await CustomSample.findSampleGuild(guild.id, name); break;
            case SAMPLE_TYPES.STANDARD: name_exists = !!await StandardSample.findByName(name); break;
        }
        if (name_exists) {
            return yield failed(UploadErrors.NameExists);
        }

        // /////////// DOWNLOADING FILE ///////////

        yield status("Downloading file...");

        const temp_raw_file = temp.path({
            prefix: "sample_download_",
            suffix: extname,
        });

        try {
            await downloadFile(attachment.url, temp_raw_file);
        } catch {
            return yield failed(UploadErrors.DownloadFailed);
        }

        // /////////// CHECKING FILE ///////////

        yield status("Checking file data...");

        try {
            const data = await ffprobe(temp_raw_file);

            if (!data.streams.some(stream => stream.codec_type === "audio" && stream.channels)) {
                return yield failed(UploadErrors.NoStreams);
            }

            const duration = data.format.duration;
            // if duration undefined and duration === 0
            if (!duration) {
                return yield failed(UploadErrors.NoDuration);
            }

            if (duration * 1000 > MAX_DURATION) {
                return yield failed(UploadErrors.TooLong);
            }
        } catch (error) {
            log.debug(error);
            return yield failed(UploadErrors.FfProbeError);
        }

        // /////////// CONVERTING FILE ///////////

        yield status("Converting and optimizing sound file...");

        const temp_conversion_file = temp.path({
            prefix: "sample_conversion_",
            suffix: CustomSample.EXT,
        });

        try {
            await convertAudio(temp_raw_file, temp_conversion_file);
        } catch (error) {
            log.debug(error);
            return yield failed(UploadErrors.ConversionError);
        }

        let sample_file: URL;
        let new_id: string | undefined;

        if (scope !== SAMPLE_TYPES.STANDARD) {
            new_id = await generateId();

            if (!new_id) {
                return yield failed(UploadErrors.IdGeneration);
            }

            sample_file = CustomSample.generateFilePath(new_id);
        } else {
            sample_file = StandardSample.generateFilePath(name);
        }

        await fs.move(temp_conversion_file, fileURLToPath(sample_file));
        await temp.cleanup();

        // /////////// FINISHING UP ///////////

        yield status("Saving to database and finishing up...");

        let sample: CustomSample | StandardSample;

        if (scope !== SAMPLE_TYPES.STANDARD) {
            sample = await CustomSample.create({
                scope: scope,
                id: new_id!,
                name: name,
                creatorId: scope === SAMPLE_TYPES.USER ? user.id : guild.id,
                userIds: scope === SAMPLE_TYPES.USER ? [user.id] : [],
                guildIds: scope === SAMPLE_TYPES.SERVER ? [guild.id] : [],
                plays: 0,
                created_at: new Date(),
                modified_at: new Date(),
            });
        } else {
            sample = await StandardSample.create({
                name: name,
                plays: 0,
                created_at: new Date(),
                modified_at: new Date(),
            });
        }

        yield sample.toEmbed({ show_timestamps: false, description: "Successfully added!", type: EmbedType.Success });
    } catch (error) {
        log.debug(error);
        yield failed(UploadErrors.General);
    }
}
