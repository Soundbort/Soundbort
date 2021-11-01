import Discord from "discord.js";

export type SimpleFuncReturn = string | Discord.MessagePayload | Discord.InteractionReplyOptions | undefined | void;

export type SimpleFunc = (interaction: Discord.CommandInteraction) => Discord.Awaitable<SimpleFuncReturn>;

export type MiddlewareFunc = (interaction: Discord.CommandInteraction) => Discord.Awaitable<boolean>;

export type GuildCreateEventHandler = (app_command: Discord.ApplicationCommand, guild: Discord.Guild) => Discord.Awaitable<void>;

export interface CommandTarget {
    global: boolean;
    guildHidden: boolean;
    guild_ids?: Discord.Snowflake[];
}
