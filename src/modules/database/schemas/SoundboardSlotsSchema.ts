export interface SoundboardSlot {
    ts: Date;
    fromUserId: string;
    ref?: string;
    count: number;
}

export interface SoundboardSlotSchema {
    slotType: "user" | "server";
    ownerId: string;
    slots: SoundboardSlot[];
}

export interface SingleSoundboardSlot extends SoundboardSlot {
    slotType: "user" | "server";
    ownerId: string;
}
