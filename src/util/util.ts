import { OWNER_IDS } from "../config";
import { COLOR, EMOJI } from "../const";
import Discord from "discord.js";

export function isOwner(userId: Discord.Snowflake): boolean {
    return OWNER_IDS.includes(userId);
}

export enum EmbedType {
    Basic,
    Success,
    Error,
    Warning,
    Info,
}

const Colors = {
    [EmbedType.Basic]: COLOR.PRIMARY,
    [EmbedType.Success]: COLOR.SUCCESS,
    [EmbedType.Error]: COLOR.ERROR,
    [EmbedType.Warning]: COLOR.WARNING,
    [EmbedType.Info]: COLOR.SECONDARY,
};
const Emoji = {
    [EmbedType.Success]: EMOJI.SUCCESS,
    [EmbedType.Error]: EMOJI.ERROR,
    [EmbedType.Warning]: EMOJI.WARNING,
    [EmbedType.Info]: EMOJI.INFO,
};

export function createEmbed(desc?: string, type: EmbedType = EmbedType.Basic, emoji?: string): Discord.MessageEmbed {
    const embed = new Discord.MessageEmbed().setColor(Colors[type]);

    if (typeof emoji === "undefined" && type !== EmbedType.Basic) emoji = Emoji[type];

    if (desc) embed.setDescription(emoji ? `${emoji} ${desc}` : desc);

    return embed;
}

export function replyEmbed(desc?: string, type?: EmbedType, emoji?: string): Discord.InteractionReplyOptions {
    return {
        embeds: [createEmbed(desc, type, emoji)],
    };
}
export function replyEmbedEphemeral(desc?: string, type?: EmbedType, emoji?: string): Discord.InteractionReplyOptions {
    return {
        ...replyEmbed(desc, type, emoji),
        ephemeral: true,
    };
}

export async function fetchMember(
    guild: Discord.Guild,
    user: Discord.UserResolvable,
    cache: boolean = true,
): Promise<Discord.GuildMember | null> {
    try {
        return await guild.members.fetch({ user, cache });
    } catch {
        return null;
    }
}

// a function that does nothing (e.g. for Promise.catch() errors we don't care about)
export function doNothing(): void {
    // Do nothing
}
