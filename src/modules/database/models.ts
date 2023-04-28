import * as database from "./index.js";
import DatabaseCache from "./DatabaseCache.js";
import databaseProxy from "./databaseProxy.js";
import { BlacklistUserSchema } from "./schemas/BlacklistUserSchema.js";
import { ActualGuildConfigSchema } from "./schemas/GuildConfigSchema.js";
import { InteractionRepliesSchema } from "./schemas/InteractionRepliesSchema.js";
import { SoundboardCustomSampleSchema } from "./schemas/SoundboardCustomSampleSchema.js";
import { SoundboardStandardSampleSchema } from "./schemas/SoundboardStandardSampleSchema.js";
import { SoundboardSlotSchema } from "./schemas/SoundboardSlotsSchema.js";
import { StatsSchema } from "./schemas/StatsSchema.js";
import { VotesSchema } from "./schemas/VotesSchema.js";
import { GuildDeletionTrackerSchema } from "./schemas/GuildDeletionTrackerSchema.js";

export enum DbCollection {
    BlacklistUser = "blacklist_user",
    GuildDeletionTracker = "guild_deletion_tracker",
    CustomSample = "soundboard_custom_sample",
    StandardSample = "soundboard_pre_sample",
    SampleSlots = "soundboard_slots",
    GuildConfig = "guild_config",
    Stats = "app_stats",
    Votes = "bot_votes",
    InteractionReplies = "interaction_replies",
}

export const blacklist_user = new DatabaseCache<BlacklistUserSchema>(DbCollection.BlacklistUser, { indexName: "userId" });

export const guild_deletion_tracker = databaseProxy<GuildDeletionTrackerSchema>(DbCollection.GuildDeletionTracker);

export const custom_sample = new DatabaseCache<SoundboardCustomSampleSchema>(DbCollection.CustomSample, { indexName: "id", maxSize: 1000 });

export const standard_sample = new DatabaseCache<SoundboardStandardSampleSchema>(DbCollection.StandardSample, { indexName: "name" });

export const sample_slots = databaseProxy<SoundboardSlotSchema>(DbCollection.SampleSlots);

export const guild_config = new DatabaseCache<ActualGuildConfigSchema>(DbCollection.GuildConfig, { indexName: "guildId" });

export const stats = databaseProxy<StatsSchema>(DbCollection.Stats);

export const votes = databaseProxy<VotesSchema>(DbCollection.Votes);

export const interaction_replies = new DatabaseCache<InteractionRepliesSchema>(DbCollection.InteractionReplies, { indexName: "interactionId" });

// Indexes

database.onConnect(async () => {
    await blacklist_user.collection.createIndex({ userId: 1 }, { unique: true });

    await guild_deletion_tracker.createIndex({ guildId: 1 }, { unique: true });
    await guild_deletion_tracker.createIndex({ markedForDeletionAt: 1 });

    await custom_sample.collection.createIndex({ id: 1 }, { unique: true });
    await custom_sample.collection.createIndex({ name: 1 });

    await standard_sample.collection.createIndex({ name: 1 }, { unique: true });

    await sample_slots.createIndex({ ownerId: 1 }, { unique: true });

    await guild_config.collection.createIndex({ guildId: 1 }, { unique: true });

    await votes.createIndex({ ts: 1, userId: 1 }, { unique: true });

    await interaction_replies.collection.createIndex({ interactionId: 1 }, { unique: true });
});
