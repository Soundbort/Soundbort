import { SAMPLE_TYPES } from "../../../const.js";

export interface SoundboardSlot {
    ts: Date;
    fromUserId: string;
    ref?: string;
    count: number;
}

export interface SoundboardSlotSchema {
    slotType: SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER;
    ownerId: string;
    slots: SoundboardSlot[];
}

export interface SingleSoundboardSlot extends SoundboardSlot {
    slotType: SAMPLE_TYPES.USER | SAMPLE_TYPES.SERVER;
    ownerId: string;
}
