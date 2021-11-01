import * as database from "./index";

import DatabaseCache from "./DatabaseCache";
import databaseProxy from "./databaseProxy";

import { BlacklistUserSchema } from "./schemas/BlacklistUserSchema";
import { ConfigSchema } from "./schemas/ConfigSchema";
import { InteractionRepliesSchema } from "./schemas/InteractionRepliesSchema";
import { SoundboardCustomSampleSchema } from "./schemas/SoundboardCustomSampleSchema";
import { SoundboardStandardSampleSchema } from "./schemas/SoundboardStandardSampleSchema";
import { SoundboardSlotSchema } from "./schemas/SoundboardSlotsSchema";
import { StatsSchema } from "./schemas/StatsSchema";
import { VotesSchema } from "./schemas/VotesSchema";

export enum DbCollection {
    BlacklistUser = "blacklist_user",
    CustomSample = "soundboard_custom_sample",
    StandardSample = "soundboard_pre_sample",
    SampleSlots = "soundboard_slots",
    Config = "guild_config",
    Stats = "app_stats",
    Votes = "bot_votes",
    InteractionReplies = "interaction_replies",
}

export const blacklist_user = new DatabaseCache<BlacklistUserSchema>(DbCollection.BlacklistUser, { indexName: "userId" });

export const custom_sample = new DatabaseCache<SoundboardCustomSampleSchema>(DbCollection.CustomSample, { indexName: "id", maxSize: 1000 });

export const standard_sample = new DatabaseCache<SoundboardStandardSampleSchema>(DbCollection.StandardSample, { indexName: "name" });

export const sample_slots = databaseProxy<SoundboardSlotSchema>(DbCollection.SampleSlots);

export const config = new DatabaseCache<ConfigSchema>(DbCollection.Config, { indexName: "guildId" });

export const stats = databaseProxy<StatsSchema>(DbCollection.Stats);

export const votes = databaseProxy<VotesSchema>(DbCollection.Votes);

export const interaction_replies = new DatabaseCache<InteractionRepliesSchema>(DbCollection.InteractionReplies, { indexName: "interactionId" });

// Indexes

database.onConnect(async () => {
    await blacklist_user.collection.createIndex({ userId: 1 }, { unique: true });

    await custom_sample.collection.createIndex({ id: 1 }, { unique: true });

    await standard_sample.collection.createIndex({ name: 1 }, { unique: true });

    await sample_slots.createIndex({ ownerId: 1 }, { unique: true });

    await config.collection.createIndex({ guildId: 1 }, { unique: true });

    await votes.createIndex({ ts: 1, userId: 1 }, { unique: true });

    await interaction_replies.collection.createIndex({ interactionId: 1 }, { unique: true });
});
