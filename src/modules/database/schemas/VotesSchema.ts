export interface VotesSchema {
    ts: Date;
    fromUserId: string;
    query: {
        userId?: string;
        guildId?: string;
        ref?: string;
    };
    votes: number;
}
