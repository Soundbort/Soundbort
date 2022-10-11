import fs from "fs-extra";
import path from "node:path";
import * as Voice from "@discordjs/voice";
import * as Discord from "discord.js";
import moment from "moment";
import escapeStringRegexp from "escape-string-regexp";

import { BUTTON_TYPES } from "../../const";
import Logger from "../../log";
import { createEmbed } from "../../util/builders/embed";
import canvas from "../../modules/canvas/index";

import { AbstractSample, ToEmbedOptions } from "./AbstractSample";

import * as models from "../../modules/database/models";
import { SoundboardStandardSampleSchema } from "../../modules/database/schemas/SoundboardStandardSampleSchema";

import InteractionRegistry from "../InteractionRegistry";

const log = Logger.child({ label: "SampleManager => StandardSample" });

export class StandardSample extends AbstractSample implements SoundboardStandardSampleSchema {
    readonly importable: boolean = false;
    readonly deletable = false;

    name: string;
    plays: number;
    created_at: Date;
    modified_at: Date;
    last_played_at: Date | undefined;

    constructor(doc: SoundboardStandardSampleSchema) {
        super(doc);

        this.name = doc.name;
        this.plays = doc.plays;
        this.created_at = doc.created_at;
        this.modified_at = doc.modified_at;
        this.last_played_at = doc.last_played_at;
    }

    get file(): string {
        return StandardSample.generateFilePath(this.name);
    }

    async play(audio_player: Voice.AudioPlayer): Promise<Voice.AudioResource<AbstractSample>> {
        log.debug("Playing standard sample %s", this.name);

        const resource = this._play(audio_player);

        const now = new Date();

        await models.standard_sample.updateOne(
            { name: this.name },
            { $inc: { plays: 1 }, $set: { last_played_at: now } },
        );

        this.plays += 1;
        this.last_played_at = now;

        return resource;
    }

    async toEmbed({ show_timestamps = true, description, type }: ToEmbedOptions): Promise<Discord.InteractionReplyOptions> {
        const embed = createEmbed(description, type);

        embed.addFields({
            name: "Name",
            value: this.name,
            inline: true,
        });

        if (show_timestamps) {
            embed.addFields({
                name: "Play Count",
                value: this.plays.toLocaleString("en"),
            }, {
                name: "Uploaded",
                value: moment(this.created_at).fromNow(),
                inline: true,
            }, {
                name: "Modified",
                value: moment(this.modified_at).fromNow(),
                inline: true,
            });
            if (this.last_played_at) {
                embed.addFields({
                    name: "Last Played",
                    value: moment(this.last_played_at).fromNow(),
                    inline: true,
                });
            }
        }

        // Waveform

        let waveform_attachment: Discord.AttachmentBuilder | undefined;

        try {
            const waveform_buffer = Buffer.from(await canvas.visualizeAudio(this.file));
            waveform_attachment = new Discord.AttachmentBuilder(waveform_buffer, { name: "waveform.png" });
            embed.setImage("attachment://waveform.png");
        } catch (error) {
            log.error("Error creating waveform for %s", this.name, error);
        }

        const buttons = [
            new Discord.ButtonBuilder()
                .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_STANDA, n: this.name }))
                .setLabel("Play")
                .setEmoji("🔉")
                .setStyle(Discord.ButtonStyle.Primary),
        ];

        return {
            embeds: [embed],
            files: waveform_attachment ? [waveform_attachment] : [],
            components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(buttons)],
        };
    }

    // UTILITY

    static async ensureDir(): Promise<void> {
        await fs.ensureDir(StandardSample.BASE, 0o0777);
    }

    static generateFilePath(name: string): string {
        return path.join(StandardSample.BASE, name + StandardSample.EXT);
    }

    static BASE = path.join(AbstractSample.BASE, "standard");
    static {
        fs.mkdirpSync(this.BASE);
    }

    // //////// STATIC DB MANAGEMENT METHODS ////////

    static async countSamples(): Promise<number> {
        return await models.standard_sample.count({});
    }

    static async getSamples(): Promise<StandardSample[]> {
        const docs = await models.standard_sample.findMany({});

        const samples: StandardSample[] = [];

        for (const doc of docs) {
            samples.push(new StandardSample(doc));
        }

        return samples;
    }

    static async fuzzySearch(name: string): Promise<StandardSample[]> {
        if (name === "") {
            return await this.getSamples();
        }

        const docs = await models.standard_sample.findMany({
            name: {
                $regex: escapeStringRegexp(name),
                $options: "i",
            },
        });

        const samples: StandardSample[] = [];

        for (const doc of docs) {
            samples.push(new StandardSample(doc));
        }

        return samples;
    }

    static async findByName(name: string): Promise<StandardSample | undefined> {
        const doc = await models.standard_sample.findOne({ name });
        if (!doc) return;

        return new StandardSample(doc);
    }

    static async create(doc: SoundboardStandardSampleSchema): Promise<StandardSample> {
        const new_doc = await models.standard_sample.insertOne(doc);

        return new StandardSample(new_doc);
    }

    static async import(sample: AbstractSample): Promise<StandardSample> {
        const file = StandardSample.generateFilePath(sample.name);

        await fs.ensureDir(path.dirname(file));
        await fs.copyFile(sample.file, file);

        const new_sample = await StandardSample.create({
            name: sample.name,
            plays: 0,
            created_at: new Date(),
            modified_at: new Date(),
        });

        return new_sample;
    }

    static async remove(sample: StandardSample): Promise<void> {
        await models.standard_sample.deleteOne({ name: sample.name });
        await fs.unlink(sample.file);
    }

    static MAX_SLOTS = 25;
}
