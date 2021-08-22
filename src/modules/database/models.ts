import DatabaseCache from "../DatabaseCache";
import databaseProxy from "../databaseProxy";
import { DbCollection } from "./collections";

import { BlacklistUserSchema } from "./schemas/BlacklistUserSchema";
import { ConfigSchema } from "./schemas/ConfigSchema";
import { SoundboardCustomSampleSchema } from "./schemas/SoundboardCustomSampleSchema";
import { SoundboardStandardSampleSchema } from "./schemas/SoundboardStandardSampleSchema";
import { StatsSchema } from "./schemas/StatsSchema";

export const blacklist_user = new DatabaseCache<BlacklistUserSchema>(DbCollection.BlacklistUser, { indexName: "userId" });

export const custom_sample = new DatabaseCache<SoundboardCustomSampleSchema>(DbCollection.CustomSample, { indexName: "id", maxSize: 1000 });

export const standard_sample = new DatabaseCache<SoundboardStandardSampleSchema>(DbCollection.StandardSample, { indexName: "name" });

export const config = new DatabaseCache<ConfigSchema>(DbCollection.Config, { indexName: "guildId" });

export const stats = databaseProxy<StatsSchema>(DbCollection.Stats);
