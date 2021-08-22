import path from "path";
import Discord from "discord.js";
import * as Voice from "@discordjs/voice";
import fs from "fs-extra";

import Logger from "../../log";
import * as database from "../../modules/database";
import * as models from "../../modules/database/models";
import { SoundboardCustomSampleSchema, SoundboardCustomSampleScope } from "../../modules/database/schemas/SoundboardCustomSampleSchema";
import { AbstractSample, ToEmbedOptions } from "./AbstractSample";
import { createEmbed } from "../../util/util";
import moment from "moment";
import InteractionRegistry from "../InteractionRegistry";
import { BUTTON_TYPES } from "../../const";

const log = Logger.child({ label: "SampleManager => CustomSample" });

database.onConnect(async () => {
    await models.custom_sample.collection.createIndex({ id: 1 }, { unique: true });
});

export interface IdResolvable { id: Discord.Snowflake }

export interface AvailableCustomSamplesResponse {
    total: number;
    user: CustomSample[];
    guild: CustomSample[];
}

export class CustomSample extends AbstractSample implements SoundboardCustomSampleSchema {
    readonly importable = true;
    readonly deletable = true;

    scope: SoundboardCustomSampleScope;
    id: string;
    userIds: string[];
    guildIds: string[];
    creatorId: string;

    constructor(doc: SoundboardCustomSampleSchema) {
        super(doc);

        this.scope = doc.scope;
        this.id = doc.id;
        this.userIds = doc.userIds;
        this.guildIds = doc.guildIds;
        this.creatorId = doc.creatorId;
    }

    get file(): string {
        return CustomSample.generateFilePath(this.id);
    }

    async play(audio_player: Voice.AudioPlayer): Promise<Voice.AudioResource<AbstractSample>> {
        log.debug("Playing custom sample %s (%s)", this.id, this.name);

        const resource = this._play(audio_player);

        const now = new Date();

        await models.custom_sample.updateOne(
            { id: this.id },
            { $inc: { plays: 1 }, $set: { last_played_at: now } },
        );

        this.plays += 1;
        this.last_played_at = now;

        return resource;
    }

    isInUsers(userId: Discord.Snowflake): boolean {
        return this.userIds.some(id => id === userId);
    }
    isInGuilds(guildId: Discord.Snowflake): boolean {
        return this.guildIds.some(id => id === guildId);
    }

    isCreator(user_guild_id: Discord.Snowflake): boolean {
        return this.creatorId === user_guild_id;
    }

    toEmbed({ show_timestamps = true, show_import = true, show_delete = true, description, type }: ToEmbedOptions): Discord.InteractionReplyOptions {
        const embed = createEmbed(description, type);

        embed.addField("Name", this.name, true);
        embed.addField("ID", this.id, true);

        if (show_timestamps) {
            embed.addField("Play Count", this.plays.toLocaleString("en"));

            embed.addField("Uploaded", moment(this.created_at).fromNow(), true);
            embed.addField("Modified", moment(this.modified_at).fromNow(), true);
            if (this.last_played_at) embed.addField("Last Played", moment(this.last_played_at).fromNow(), true);
        }

        embed.addField("Importable", this.importable ? "✅" : "❌", true);

        // Action buttons:

        const rows = [];

        if (this.importable && show_import) {
            const import_buttons = [
                new Discord.MessageButton()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.IMPORT_USER, id: this.id }))
                    .setLabel("Import to User Board")
                    .setEmoji("📥")
                    .setStyle("SECONDARY"),
                new Discord.MessageButton()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.IMPORT_SERVER, id: this.id }))
                    .setLabel("Import to Server Board")
                    .setEmoji("📥")
                    .setStyle("SECONDARY"),
            ];

            rows.push(
                new Discord.MessageActionRow().addComponents(import_buttons),
            );
        }

        const buttons = [
            new Discord.MessageButton()
                .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_CUSTOM, id: this.id }))
                .setLabel("Play")
                .setEmoji("🔉")
                .setStyle("SUCCESS"),
        ];

        if (this.deletable && show_delete) {
            buttons.push(
                new Discord.MessageButton()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.DELETE_ASK, id: this.id }))
                    .setLabel("Delete")
                    .setEmoji("🗑️")
                    .setStyle("DANGER"),
            );
        }

        rows.unshift(
            new Discord.MessageActionRow().addComponents(buttons),
        );

        return {
            embeds: [embed],
            components: rows,
        };
    }

    // //////// STATIC DB MANAGEMENT METHODS ////////

    static count(): Promise<number> {
        return models.custom_sample.estimatedCount();
    }

    static async findById(id: string): Promise<CustomSample | undefined> {
        const doc = await models.custom_sample.findOne({ id });
        if (!doc) return;

        return new CustomSample(doc);
    }

    static async findByNameNoOrder(guildId: Discord.Snowflake | null, userId: Discord.Snowflake, name: string): Promise<CustomSample | undefined> {
        if (!guildId) return await CustomSample.findSampleUser(userId, name);

        const doc = await models.custom_sample.findOne({
            $or: [
                { userIds: userId },
                { guildIds: guildId },
            ],
            name: name,
        });
        if (!doc) return;

        return new CustomSample(doc);
    }

    /**
     * we go and take 2 roundtrips to the database, to guarantee user
     * samples are searched before guild samples
     * It's not ideal but it will do. **If order doesn't matter, use findByNameNoOrder() instead**
     */
    static async findByName(guildId: Discord.Snowflake | null, userId: Discord.Snowflake, name: string): Promise<CustomSample | undefined> {
        if (!guildId) return await CustomSample.findSampleUser(userId, name);

        const sample = await CustomSample.findSampleUser(userId, name);
        if (sample) return sample;

        return await CustomSample.findSampleGuild(guildId, name);
    }

    static async findSampleUser(userId: Discord.Snowflake, name: string): Promise<CustomSample | undefined> {
        const doc = await models.custom_sample.findOne({
            userIds: userId,
            name: name,
        });
        if (!doc) return;

        return new CustomSample(doc);
    }

    static async findSampleGuild(guildId: Discord.Snowflake, name: string): Promise<CustomSample | undefined> {
        const doc = await models.custom_sample.findOne({
            guildIds: guildId,
            name: name,
        });
        if (!doc) return;

        return new CustomSample(doc);
    }

    static async countUserSamples(userId: Discord.Snowflake): Promise<number> {
        return await models.custom_sample.count({
            userIds: userId,
        });
    }
    static async countGuildSamples(guildId: Discord.Snowflake): Promise<number> {
        return await models.custom_sample.count({
            guildIds: guildId,
        });
    }

    static async getUserSamples(userId: Discord.Snowflake): Promise<CustomSample[]> {
        const docs = await models.custom_sample.findMany(
            { userIds: userId },
        );

        const samples: CustomSample[] = [];

        for (const doc of docs) {
            samples.push(new CustomSample(doc));
        }

        return samples;
    }

    static async getGuildSamples(guildId: Discord.Snowflake): Promise<CustomSample[]> {
        const docs = await models.custom_sample.findMany(
            { guildIds: guildId },
        );

        const samples: CustomSample[] = [];

        for (const doc of docs) {
            samples.push(new CustomSample(doc));
        }

        return samples;
    }

    static async create(doc: SoundboardCustomSampleSchema): Promise<CustomSample> {
        const new_sample = await models.custom_sample.insertOne(doc);

        return new CustomSample(new_sample);
    }

    static async import(user_guild_to: Discord.User | Discord.Guild, sample: CustomSample): Promise<CustomSample | undefined> {
        const new_sample = await models.custom_sample.updateOne(
            { id: sample.id },
            {
                $addToSet: user_guild_to instanceof Discord.User
                    ? { userIds: user_guild_to.id }
                    : { guildIds: user_guild_to.id },
            },
        );

        if (new_sample) return new CustomSample(new_sample);
    }

    /**
     * Deletes a custom sample from a soundboard
     */
    static async remove(user_guild_id: Discord.Snowflake, sample: CustomSample): Promise<void> {
        if (sample.creatorId === user_guild_id) {
            await this.removeCompletely(sample);
        } else {
            await models.custom_sample.updateOne(
                { id: sample.id },
                { $pull: { userIds: user_guild_id, guildIds: user_guild_id } },
            );
        }
    }

    /**
     * Deletes a custom sample from cache, database and file system
     */
    static async removeCompletely(sample: CustomSample): Promise<void> {
        await models.custom_sample.deleteOne({ id: sample.id });
        await fs.unlink(sample.file);
    }

    static async ensureDir(): Promise<void> {
        await fs.ensureDir(AbstractSample.BASE, 0o0777);
    }

    static generateFilePath(id: string): string {
        return path.join(CustomSample.BASE, id + CustomSample.EXT);
    }
}
