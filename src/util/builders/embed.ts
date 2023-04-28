import * as Discord from "discord.js";

import { COLOR, EMOJI } from "../../const.js";

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
    [EmbedType.Info]: COLOR.INFO,
};
const Emoji = {
    [EmbedType.Success]: EMOJI.SUCCESS,
    [EmbedType.Error]: EMOJI.ERROR,
    [EmbedType.Warning]: EMOJI.WARNING,
    [EmbedType.Info]: EMOJI.INFO,
};

export function createEmbed(desc?: string, type: EmbedType = EmbedType.Basic, emoji?: string): Discord.EmbedBuilder {
    const embed = new Discord.EmbedBuilder().setColor(Colors[type]);

    if (emoji === undefined && type !== EmbedType.Basic) emoji = Emoji[type];

    if (desc) embed.setDescription(emoji ? `${emoji} ${desc}` : desc);

    return embed;
}

export function replyEmbed(desc?: string, type?: EmbedType, emoji?: string): Pick<Discord.InteractionReplyOptions, "embeds"> {
    return {
        embeds: [createEmbed(desc, type, emoji)],
    };
}
export function replyEmbedEphemeral(desc?: string, type?: EmbedType, emoji?: string): Pick<Discord.InteractionReplyOptions, "embeds" | "ephemeral"> {
    return {
        ...replyEmbed(desc, type, emoji),
        ephemeral: true,
    };
}
