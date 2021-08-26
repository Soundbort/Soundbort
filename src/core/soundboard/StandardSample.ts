import fs from "fs-extra";
import path from "path";
import * as Voice from "@discordjs/voice";
import Discord from "discord.js";
import moment from "moment";

import InteractionRegistry from "../InteractionRegistry";
import { createEmbed } from "../../util/util";
import { BUTTON_TYPES } from "../../const";
import Logger from "../../log";
import * as database from "../../modules/database";
import * as models from "../../modules/database/models";
import { SoundboardStandardSampleSchema } from "../../modules/database/schemas/SoundboardStandardSampleSchema";
import { AbstractSample, ToEmbedOptions } from "./AbstractSample";

const log = Logger.child({ label: "SampleManager => StandardSample" });

database.onConnect(async () => {
    await models.standard_sample.collection.createIndex({ name: 1 }, { unique: true });
});

export class StandardSample extends AbstractSample implements SoundboardStandardSampleSchema {
    readonly importable: boolean = false;
    readonly deletable = false;

    name: string;
    plays: number;
    orig_filename: string | undefined;
    created_at: Date;
    modified_at: Date;
    last_played_at: Date | undefined;

    constructor(doc: SoundboardStandardSampleSchema) {
        super(doc);

        this.name = doc.name;
        this.plays = doc.plays;
        this.orig_filename = doc.orig_filename || undefined;
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
                .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_STANDA, n: this.name }))
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
            orig_filename: sample.orig_filename,
            created_at: new Date(),
            modified_at: new Date(),
        });

        return new_sample;
    }

    static async remove(sample: StandardSample): Promise<void> {
        await models.standard_sample.deleteOne({ name: sample.name });
        await fs.unlink(sample.file);
    }

    // UTILITY

    static async ensureDir(): Promise<void> {
        await fs.ensureDir(StandardSample.BASE, 0o0777);
    }

    static generateFilePath(name: string): string {
        return path.join(StandardSample.BASE, name + StandardSample.EXT);
    }

    static BASE = path.join(AbstractSample.BASE, "standard");
}
