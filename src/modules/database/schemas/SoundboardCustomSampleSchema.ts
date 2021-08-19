import { SoundboardStandardSampleSchema } from "./SoundboardStandardSampleSchema";

export type SoundboardCustomSampleScope = "user" | "server";

export interface SoundboardCustomSampleSchema extends SoundboardStandardSampleSchema {
    id: string;
    creatorId: string;
    scope: SoundboardCustomSampleScope;
    userIds: string[];
    guildIds: string[];
}
