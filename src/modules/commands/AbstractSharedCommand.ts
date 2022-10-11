import * as Discord from "discord.js";

export type MiddlewareFunc = (interaction: Discord.ChatInputCommandInteraction) => Discord.Awaitable<boolean>;

export type SimpleFuncReturn = string | Discord.MessagePayload | Discord.InteractionReplyOptions | undefined | void;

export type SimpleFunc = (interaction: Discord.ChatInputCommandInteraction) => Discord.Awaitable<SimpleFuncReturn>;

export interface SharedCommandOptions {
    /**
     * 1-32 character name; `CHAT_INPUT` command names must be all lowercase matching `^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$`
     */
    name: string;
    /**
     * Localization dictionary for the name field. Values follow the same restrictions as name
     */
    name_localizations?: Discord.LocalizationMap | null;
    /**
     * 1-100 character description for `CHAT_INPUT` commands, empty string for `USER` and `MESSAGE` commands
     */
    description: string;
    /**
     * Localization dictionary for the description field. Values follow the same restrictions as description
     */
    description_localizations?: Discord.LocalizationMap | null;
}
