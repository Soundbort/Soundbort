export interface InteractionRepliesSchema {
    interactionId: string;
    guildId: string | null;
    channelId: string;
    messageId: string;
}
