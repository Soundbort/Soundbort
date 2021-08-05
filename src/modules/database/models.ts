import { Collection } from "mongodb";
import { get } from ".";
import { DbCollection } from "./collections";

import { BlacklistUserSchema } from "./schemas/BlacklistUserSchema";
import { ConfigSchema } from "./schemas/ConfigSchema";
import { SoundboardCustomSampleSchema } from "./schemas/SoundboardCustomSampleSchema";
import { SoundboardPredefinedSampleSchema } from "./schemas/SoundboardPredefinedSampleSchema";
import { StatsSchema } from "./schemas/StatsSchema";

export function collectionBlacklistUser(): Collection<BlacklistUserSchema> {
    return get().collection<BlacklistUserSchema>(DbCollection.BlacklistUser);
}

export function collectionCustomSample(): Collection<SoundboardCustomSampleSchema> {
    return get().collection<SoundboardCustomSampleSchema>(DbCollection.CustomSample);
}

export function collectionPredefinedSample(): Collection<SoundboardPredefinedSampleSchema> {
    return get().collection<SoundboardPredefinedSampleSchema>(DbCollection.PredefinedSample);
}

export function collectionConfig(): Collection<ConfigSchema> {
    return get().collection<ConfigSchema>(DbCollection.Config);
}

export function collectionStats(): Collection<StatsSchema> {
    return get().collection<StatsSchema>(DbCollection.Stats);
}
