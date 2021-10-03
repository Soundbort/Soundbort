export interface SoundboardStandardSampleSchema {
    name: string;
    plays: number;
    created_at: Date;
    modified_at: Date;
    last_played_at?: Date;
}
