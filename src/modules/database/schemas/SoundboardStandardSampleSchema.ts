export interface SoundboardStandardSampleSchema {
    name: string;
    orig_filename?: string;
    plays: number;
    created_at: Date;
    modified_at: Date;
    last_played_at?: Date;
}
