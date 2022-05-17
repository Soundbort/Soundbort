import { SetOptional } from "type-fest";

export interface GuildConfigSchema {
    guildId: string;
    allowForeignSamples: boolean;
}

/**
 * The actual real-life expected content of the documents.
 */
export type ActualGuildConfigSchema = SetOptional<GuildConfigSchema, "allowForeignSamples">;
