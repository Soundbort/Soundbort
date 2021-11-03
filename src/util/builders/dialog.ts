import { randomUUID } from "node:crypto";
import Discord from "discord.js";
import { BUTTON_TYPES } from "../../const.js";
import InteractionRegistry, { ButtonParsed } from "../../core/InteractionRegistry.js";
import { doNothing } from "../util.js";
import { createEmbed, EmbedType } from "./embed.js";

export interface DialogOptionsButton {
    id: ButtonParsed;
    label: string;
    emoji?: string;
    style?: Discord.MessageButtonStyleResolvable;
}

export interface DialogOptions {
    interaction: Discord.CommandInteraction | Discord.ButtonInteraction;
    dialog_text: string;
    dialog_type?: EmbedType;
    abort_type?: BUTTON_TYPES;
    buttons: DialogOptionsButton[];
}

export async function createDialog({ interaction, dialog_text, dialog_type = EmbedType.Basic, abort_type, buttons }: DialogOptions) {
    const dialogId = randomUUID();

    const message_buttons: Discord.MessageButton[] = [];

    for (const button of buttons) {
        const message_button = new Discord.MessageButton()
            .setCustomId(InteractionRegistry.encodeButtonId({ ...button.id, did: dialogId }))
            .setLabel(button.label);
        if (button.emoji) message_button.setEmoji(button.emoji);
        if (button.style) message_button.setStyle(button.style);

        message_buttons.push(message_button);
    }

    if (typeof abort_type !== "undefined") {
        message_buttons.push(
            new Discord.MessageButton()
                .setCustomId(InteractionRegistry.encodeButtonId({ t: abort_type, did: dialogId }))
                .setLabel("Abort")
                .setEmoji("⚪")
                .setStyle("SECONDARY"),
        );
    }

    const embed = createEmbed(dialog_text, dialog_type);

    const replied_msg = await interaction.reply({
        embeds: [embed],
        components: [new Discord.MessageActionRow().addComponents(message_buttons)],
        fetchReply: true,
    });

    // as a lil UX sugar, delete dialog once one of the buttons was clicked

    if (!interaction.channel) return;

    try {
        await interaction.channel.awaitMessageComponent({
            filter: new_inter => {
                const decoded = InteractionRegistry.decodeButtonId(new_inter.customId);

                return new_inter.user.id === interaction.user.id &&
                    decoded.did === dialogId;
            },
            componentType: "BUTTON",
            time: 5 * 60 * 1000,
        });

        await interaction.channel.messages.delete(replied_msg.id).catch(doNothing);
    } catch (error: any) {
        // "time" is an expected error. Only bubble up when error reason is not "time"
        if (error.code === "INTERACTION_COLLECTOR_ERROR" &&
            typeof error.message === "string" &&
            error.message.endsWith("time")) return;

        throw error;
    }
}
