import fs from "fs-extra";
import path from "path";
import * as Voice from "@discordjs/voice";

import { collectionPredefinedSample } from "../../../modules/database/models";
import Logger from "../../../log";
import database from "../../../modules/database";
import { SoundboardPredefinedSampleSchema } from "../../../modules/database/schemas/SoundboardPredefinedSampleSchema";
import { AbstractSample } from "./AbstractSample";
import Cache from "../../../modules/Cache";

const log = Logger.child({ label: "SampleManager => PredefinedSample" });

const cache = new Cache<string, PredefinedSample>({ maxSize: 1000 });

database.onConnect(async () => {
    await collectionPredefinedSample().createIndex({ name: 1 }, { unique: true });
});

export class PredefinedSample extends AbstractSample implements SoundboardPredefinedSampleSchema {
    readonly importable: boolean = false;

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
        await collectionPredefinedSample().updateOne({ name: this.name }, { $inc: { plays: 1 }, $set: { last_played_at: new Date() } });
        return resource;
    }

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

    static async import(sample: AbstractSample): Promise<PredefinedSample | undefined> {
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
