import { SAMPLE_TYPES } from "../../../const";
import { SoundboardStandardSampleSchema } from "./SoundboardStandardSampleSchema";

export type SoundboardCustomSampleScope = SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER;

export interface SoundboardCustomSampleSchema extends SoundboardStandardSampleSchema {
    id: string;
    creatorId: string;
    scope: SoundboardCustomSampleScope;
    userIds: string[];
    guildIds: string[];
}
