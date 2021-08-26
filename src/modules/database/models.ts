import DatabaseCache from "./DatabaseCache";
import databaseProxy from "./databaseProxy";

import { BlacklistUserSchema } from "./schemas/BlacklistUserSchema";
import { ConfigSchema } from "./schemas/ConfigSchema";
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
}

export const blacklist_user = new DatabaseCache<BlacklistUserSchema>(DbCollection.BlacklistUser, { indexName: "userId" });

export const custom_sample = new DatabaseCache<SoundboardCustomSampleSchema>(DbCollection.CustomSample, { indexName: "id", maxSize: 1000 });

export const standard_sample = new DatabaseCache<SoundboardStandardSampleSchema>(DbCollection.StandardSample, { indexName: "name" });

export const sample_slots = databaseProxy<SoundboardSlotSchema>(DbCollection.SampleSlots);

export const config = new DatabaseCache<ConfigSchema>(DbCollection.Config, { indexName: "guildId" });

export const stats = databaseProxy<StatsSchema>(DbCollection.Stats);

export const votes = databaseProxy<VotesSchema>(DbCollection.Votes);
