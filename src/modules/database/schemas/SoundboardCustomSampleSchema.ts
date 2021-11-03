import { SAMPLE_TYPES } from "../../../const.js";
import { SoundboardStandardSampleSchema } from "./SoundboardStandardSampleSchema.js";

export type SoundboardCustomSampleScope = SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER;

export interface SoundboardCustomSampleSchema extends SoundboardStandardSampleSchema {
    id: string;
    creatorId: string;
    scope: SoundboardCustomSampleScope;
    userIds: string[];
    guildIds: string[];
}
