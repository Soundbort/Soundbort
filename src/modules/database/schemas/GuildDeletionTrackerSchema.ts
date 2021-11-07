export interface GuildDeletionTrackerSchema {
    guildId: string;
    markedForDeletionAt?: Date;
}
