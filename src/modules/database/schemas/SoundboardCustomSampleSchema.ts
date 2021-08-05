import { SoundboardPredefinedSampleSchema } from "./SoundboardPredefinedSampleSchema";

export type SoundboardCustomSampleScope = "user" | "server";

export interface SoundboardCustomSampleSchema extends SoundboardPredefinedSampleSchema {
    id: string;
    creatorId: string;
    scope: SoundboardCustomSampleScope;
    userIds: string[];
    guildIds: string[];
}
