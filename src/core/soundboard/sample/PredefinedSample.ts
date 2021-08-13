import fs from "fs-extra";
import path from "path";
import * as Voice from "@discordjs/voice";
import Discord from "discord.js";

import { collectionPredefinedSample } from "../../../modules/database/models";
import Logger from "../../../log";
import database from "../../../modules/database";
import { SoundboardPredefinedSampleSchema } from "../../../modules/database/schemas/SoundboardPredefinedSampleSchema";
import { AbstractSample, ToEmbedOptions } from "./AbstractSample";
import Cache from "../../../modules/Cache";
import { createEmbed } from "../../../util/util";
import moment from "moment";
import { BUTTON_IDS } from "../../../const";

const log = Logger.child({ label: "SampleManager => PredefinedSample" });

const cache = new Cache<string, PredefinedSample>({ maxSize: 1000 });

database.onConnect(async () => {
    await collectionPredefinedSample().createIndex({ name: 1 }, { unique: true });
});

export class PredefinedSample extends AbstractSample implements SoundboardPredefinedSampleSchema {
    readonly importable: boolean = false;
    readonly deletable = false;

    name: string;
    plays: number;
    orig_filename: string | undefined;
    created_at: Date;
    modified_at: Date;
    last_played_at: Date | undefined;

    constructor(doc: SoundboardPredefinedSampleSchema) {
        super(doc);

        this.name = doc.name;
        this.plays = doc.plays;
        this.orig_filename = doc.orig_filename || undefined;
        this.created_at = doc.created_at;
        this.modified_at = doc.modified_at;
        this.last_played_at = doc.last_played_at;
    }

    get file(): string {
        return PredefinedSample.generateFilePath(this.name);
    }

    async play(audio_player: Voice.AudioPlayer): Promise<Voice.AudioResource<AbstractSample>> {
        log.debug("Playing standard sample %s", this.name);

        const resource = this._play(audio_player);

        const now = new Date();

        await collectionPredefinedSample().updateOne(
            { name: this.name },
            { $inc: { plays: 1 }, $set: { last_played_at: now } },
        );

        this.plays += 1;
        this.last_played_at = now;

        return resource;
    }

    toEmbed({ show_timestamps = true, description, type }: ToEmbedOptions): Discord.InteractionReplyOptions {
        const embed = createEmbed(description, type);

        embed.addField("Name", this.name, true);

        if (show_timestamps) {
            embed.addField("Play Count", this.plays.toLocaleString("en"));

            embed.addField("Uploaded", moment(this.created_at).fromNow(), true);
            embed.addField("Modified", moment(this.modified_at).fromNow(), true);
            if (this.last_played_at) embed.addField("Last Played", moment(this.last_played_at).fromNow(), true);
        }

        embed.addField("Importable", this.importable ? "✅" : "❌", true);

        const buttons = [];
        buttons.push(
            new Discord.MessageButton()
                .setCustomId(BUTTON_IDS.PREDEF_PLAY + this.name)
                .setLabel("Play")
                .setEmoji("🔉")
                .setStyle("SUCCESS"),
        );

        return {
            embeds: [embed],
            components: [new Discord.MessageActionRow().addComponents(buttons)],
        };
    }

    // //////// STATIC DB MANAGEMENT METHODS ////////

    static async findByName(name: string): Promise<PredefinedSample | undefined> {
        const doc = await collectionPredefinedSample().findOne({ name });
        if (!doc) return;

        return new PredefinedSample(doc);
    }

    static async countSamples(): Promise<number> {
        return await collectionPredefinedSample().countDocuments({});
    }

    static async getSamples(): Promise<PredefinedSample[]> {
        const docs = await collectionPredefinedSample()
            .find({})
            .toArray();

        const samples: PredefinedSample[] = [];

        for (const doc of docs) {
            const sample = new PredefinedSample(doc);

            samples.push(sample);
            cache.set(sample.name, sample);
        }

        return samples;
    }

    static async import(sample: AbstractSample): Promise<PredefinedSample> {
        const file = PredefinedSample.generateFilePath(sample.name);

        await fs.ensureDir(path.dirname(file));
        await fs.copyFile(sample.file, file);

        const new_sample = await PredefinedSample.create({
            name: sample.name,
            plays: 0,
            orig_filename: sample.orig_filename,
            created_at: new Date(),
            modified_at: new Date(),
        });

        return new_sample;
    }

    static async create(doc: SoundboardPredefinedSampleSchema): Promise<PredefinedSample> {
        await collectionPredefinedSample().insertOne(doc);

        return new PredefinedSample(doc);
    }

    static async remove(sample: PredefinedSample): Promise<void> {
        await collectionPredefinedSample().deleteOne({ name: sample.name });
        await fs.unlink(sample.file);
    }

    static async ensureDir(): Promise<void> {
        await fs.ensureDir(PredefinedSample.BASE, 0o0777);
    }

    static generateFilePath(name: string): string {
        return path.join(PredefinedSample.BASE, name + ".ogg");
    }

    static BASE = path.join(AbstractSample.BASE, "standard");
}
