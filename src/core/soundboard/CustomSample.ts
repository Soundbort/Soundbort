import path from "node:path";
import * as Discord from "discord.js";
import * as Voice from "@discordjs/voice";
import fs from "fs-extra";
import moment from "moment";
import { Filter } from "mongodb";
import escapeStringRegexp from "escape-string-regexp";
import { TypedEmitter } from "tiny-typed-emitter";

import Logger from "../../log";
import { BUTTON_TYPES, SAMPLE_TYPES } from "../../const";
import { createEmbed } from "../../util/builders/embed";
import canvas from "../../modules/canvas/index";

import { AbstractSample, ToEmbedOptions } from "./AbstractSample";

import * as models from "../../modules/database/models";
import { SoundboardCustomSampleSchema, SoundboardCustomSampleScope } from "../../modules/database/schemas/SoundboardCustomSampleSchema";
import { SingleSoundboardSlot, SoundboardSlot } from "../../modules/database/schemas/SoundboardSlotsSchema";
import { VotesSchema } from "../../modules/database/schemas/VotesSchema";

import InteractionRegistry from "../InteractionRegistry";
import VotesManager from "../data-managers/VotesManager";

const log = Logger.child({ label: "SampleManager => CustomSample" });

export interface CustomSampleEmitterEvents {
    slotAdd(slot: SingleSoundboardSlot, new_: number, old: number): void;
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
        return this.userIds.includes(userId);
    }
    isInGuilds(guildId: Discord.Snowflake): boolean {
        return this.guildIds.includes(guildId);
    }

    isCreator(user_guild_id: Discord.Snowflake): boolean {
        return this.creatorId === user_guild_id;
    }

    async toEmbed({ show_timestamps = true, show_import = true, show_delete = true, description, type }: ToEmbedOptions): Promise<Discord.InteractionReplyOptions> {
        const embed = createEmbed(description, type);

        embed.addFields({
            name: "Name",
            value: this.name,
            inline: true,
        }, {
            name: "ID",
            value: this.id,
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
            log.error("Error creating waveform for %s", this.id, error);
        }

        // Action buttons:

        const rows: Discord.ActionRowBuilder<Discord.ButtonBuilder>[] = [];

        if (this.importable && show_import) {
            const import_buttons = [
                new Discord.ButtonBuilder()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.IMPORT_USER, id: this.id }))
                    .setLabel("Import to User Board")
                    .setEmoji("📥")
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.IMPORT_SERVER, id: this.id }))
                    .setLabel("Import to Server Board")
                    .setEmoji("📥")
                    .setStyle(Discord.ButtonStyle.Secondary),
            ];

            rows.push(
                new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(import_buttons),
            );
        }

        const buttons = [
            new Discord.ButtonBuilder()
                .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_CUSTOM, id: this.id }))
                .setLabel("Play")
                .setEmoji("🔉")
                .setStyle(Discord.ButtonStyle.Primary),
        ];

        if (this.deletable && show_delete) {
            buttons.push(
                new Discord.ButtonBuilder()
                    .setCustomId(InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.DELETE_ASK, id: this.id }))
                    .setLabel("Delete")
                    .setEmoji("🗑️")
                    .setStyle(Discord.ButtonStyle.Danger),
            );
        }

        rows.unshift(
            new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(buttons),
        );

        return {
            embeds: [embed],
            files: waveform_attachment ? [waveform_attachment] : [],
            components: rows,
        };
    }

    // UTILITY

    static async ensureDir(): Promise<void> {
        await fs.ensureDir(AbstractSample.BASE, 0o0777);
    }

    static generateFilePath(id: string): string {
        return path.join(CustomSample.BASE, id + CustomSample.EXT);
    }

    // //////// STATIC DB MANAGEMENT METHODS ////////

    static async count(): Promise<number> {
        return await models.custom_sample.estimatedCount();
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

    // FIND SAMPLES

    static async fuzzySearch(sample_name: string, { userId, guildId }: { userId?: string, guildId?: string }): Promise<CustomSample[]> {
        if (!guildId && !userId) {
            return [];
        }

        if (sample_name === "") {
            if (!guildId && userId) {
                return await CustomSample.getUserSamples(userId);
            }
            if (guildId && !userId) {
                return await CustomSample.getGuildSamples(guildId);
            }

            const docs = await models.custom_sample.findMany({
                $or: [
                    { userIds: userId },
                    { guildIds: guildId },
                ],
            });

            return docs.map(doc => new CustomSample(doc));
        }

        let query: Filter<SoundboardCustomSampleSchema>;

        const name = {
            $regex: escapeStringRegexp(sample_name),
            $options: "i",
        };

        if (!guildId && userId) {
            query = { userIds: userId, name };
        } else if (guildId && !userId) {
            query = { guildIds: guildId, name };
        } else {
            query = {
                $or: [
                    { userIds: userId },
                    { guildIds: guildId },
                ],
                name,
            };
        }

        const docs = await models.custom_sample.findMany(query);

        return docs.map(doc => new CustomSample(doc));
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

    // CREATE / ADD SAMPLES

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

    // REMOVE SAMPLE

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

    /**
     * Remove all samples in a soundboard
     */
    static async removeAll(user_guild_id: Discord.Snowflake, scope: SAMPLE_TYPES.SERVER | SAMPLE_TYPES.STANDARD): Promise<void> {
        const samples = await (scope === SAMPLE_TYPES.SERVER ? this.getGuildSamples(user_guild_id) : this.getUserSamples(user_guild_id));

        for (const sample of samples) {
            await this.remove(user_guild_id, sample);
        }
    }

    // SLOTS

    static MIN_SLOTS = 10;
    static MAX_SLOTS = 25;

    static emitter = new TypedEmitter<CustomSampleEmitterEvents>();

    static async addSlot(vote: VotesSchema): Promise<boolean> {
        const slotType = vote.query.guildId ? SAMPLE_TYPES.SERVER : SAMPLE_TYPES.USER;
        const ownerId = vote.query.guildId || vote.query.userId || vote.fromUserId;

        const curr_slots = await this.countSlots(ownerId);
        if (curr_slots >= this.MAX_SLOTS) {
            return false;
        }

        // clamp to MAX_SLOTS
        const votes = Math.min(this.MAX_SLOTS, curr_slots + vote.votes) - curr_slots;

        const slot_received: SoundboardSlot = {
            ts: vote.ts,
            ref: vote.query.ref,
            fromUserId: vote.fromUserId,
            count: votes,
        };

        await models.sample_slots.updateOne(
            { ownerId: ownerId },
            { $push: { slots: slot_received }, $setOnInsert: { slotType } },
            { upsert: true },
        );

        const single_slot: SingleSoundboardSlot = {
            slotType,
            ownerId,
            ...slot_received,
        };

        log.debug(`Added ${slot_received.count} slots to ${slotType} ${ownerId} from ${vote.fromUserId}`);

        this.emitter.emit("slotAdd", single_slot, curr_slots + votes, curr_slots);

        return true;
    }

    static async removeSlots(ownerId: Discord.Snowflake): Promise<void> {
        await models.sample_slots.deleteOne({ ownerId });
    }

    static async countSlots(ownerId: Discord.Snowflake): Promise<number> {
        const add_slots = await models.sample_slots
            .aggregate()
            .match({ ownerId })
            .project<{ count: number }>({ count: { $sum: "$slots.count" }, _id: 0 })
            .toArray();

        return (add_slots[0]?.count ?? 0) + this.MIN_SLOTS;
    }
}

VotesManager.on("vote", async vote => {
    try {
        await CustomSample.addSlot(vote);
    } catch (error) {
        log.error("Error while adding a vote (from:%s, amount:%d) to a slot", vote.fromUserId, vote.votes, error);
    }
});
