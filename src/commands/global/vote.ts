import * as Discord from "discord.js";

import { SAMPLE_TYPES } from "../../const";
import { BOT_NAME, TOP_GG_WEBHOOK_TOKEN } from "../../config";

import { formatEllipsis } from "../../util/string";

import { CmdInstallerArgs } from "../../util/types";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createEmbed, replyEmbed } from "../../util/builders/embed";

import { SingleSoundboardSlot } from "../../modules/database/schemas/SoundboardSlotsSchema";
import InteractionRepliesManager from "../../core/data-managers/InteractionRepliesManager";

// 66 lines for this? maybe we can reduce the amount of code later and make it more readable as well

async function sendMessageReply(client: Discord.Client<true>, slot: SingleSoundboardSlot, new_slots: number, refId: Discord.Snowflake): Promise<void> {
    const doc = await InteractionRepliesManager.fetch(refId);
    if (!doc) return;

    if (slot.slotType === SAMPLE_TYPES.SERVER && (!doc.guildId || slot.ownerId !== doc.guildId)) return;

    // get channel
    let channel: Discord.AnyChannel | null | undefined;
    if (doc.guildId) {
        const guild = await client.guilds.fetch(doc.guildId);
        channel = await guild.channels.fetch(doc.channelId);
    } else if (slot.slotType === SAMPLE_TYPES.USER) {
        channel = await client.channels.fetch(doc.channelId, { allowUnknownGuild: true });
    }

    if (!channel || !channel.isText()) return;

    // make text
    const slot_text = slot.count === 1 ? "one soundboard slot" : "two soundboard slots";

    let text: string;
    if (slot.slotType === SAMPLE_TYPES.SERVER) {
        text = `${Discord.userMention(slot.fromUserId)} gave this server ${slot_text}.`;
    } else {
        text = `${Discord.userMention(slot.fromUserId)} gave ${Discord.userMention(slot.ownerId)} ${slot_text}.`;
    }
    text += ` Now it has ${new_slots} slots.`;

    await channel.send({
        ...replyEmbed(text),
        reply: {
            messageReference: doc.messageId,
            failIfNotExists: true,
        },
    });
}

async function sendDM(client: Discord.Client<true>, slot: SingleSoundboardSlot, new_slots: number) {
    const user = await client.users.fetch(slot.ownerId);
    const dm = await user.createDM();

    let text: string;
    if (slot.ownerId === slot.fromUserId) {
        text = (slot.count === 1 ? "One new slot has" : "Two new slots have") + " been added to your personal soundboard.";
    } else {
        text = `${Discord.userMention(slot.fromUserId)} added ` + (slot.count === 1 ? "one new slot" : "two new slots") + " to your personal soundboard.";
    }
    text += ` Now you have ${new_slots} slots.`;

    await dm.send(replyEmbed(text));
}

export function install({ client, registry }: CmdInstallerArgs): void {
    CustomSample.emitter.on("slotAdd", async (slot, new_slots) => {
        if (slot.ref) {
            try {
                await sendMessageReply(client, slot, new_slots, slot.ref);
            } catch (error) { error; }
        }

        if (slot.slotType === SAMPLE_TYPES.USER) {
            try {
                await sendDM(client, slot, new_slots);
            } catch (error) { error; }
        }
    });

    if (!TOP_GG_WEBHOOK_TOKEN) return;

    registry.addCommand(new SlashCommand({
        name: "vote",
        description: `Upvote ${BOT_NAME} on top.gg to get more sample slots for your or someone else's soundboard.`,
        permissions: SlashCommandPermissions.GLOBAL,
        async func(interaction) {
            const interactionId = interaction.id;
            const client = interaction.client as Discord.Client<true>;
            const vote_base_link = `https://top.gg/bot/868296331234521099/vote?ref=${interactionId}`;

            const embed = createEmbed()
                .setAuthor({
                    name: BOT_NAME + " | Voting",
                    iconURL: client.user.avatarURL({ size: 32, dynamic: true }) || undefined,
                })
                .setDescription(
                    "To get more slots for your soundboard you can upvote the bot through the links below.\n" +
                    "Other users can use these links as well to give you or this server more slots.\n" +
                    "One vote equals one slot. On weekends you get two slots! " +
                    `A soundboard can't have more than ${CustomSample.MAX_SLOTS} slots (at the moment).`,
                );

            const user = interaction.user;
            const user_vote_link = vote_base_link + "&userId=" + user.id;
            const user_label = formatEllipsis(`Get slots for %#${user.discriminator}`, user.username, 80); // label text max 80 characters
            const buttons: Discord.MessageButton[] = [
                new Discord.MessageButton()
                    .setLabel(user_label)
                    .setEmoji("🗳️")
                    .setURL(user_vote_link)
                    .setStyle("LINK"),
            ];

            if (interaction.guild) {
                const guild = interaction.guild;
                const guild_vote_link = vote_base_link + "&guildId=" + guild.id;
                const guild_label = formatEllipsis("Get slots for Server '%'", guild.name, 80); // label text max 80 characters
                buttons.push(
                    new Discord.MessageButton()
                        .setLabel(guild_label)
                        .setEmoji("🗳️")
                        .setURL(guild_vote_link)
                        .setStyle("LINK"),
                );
            }

            const reply = await interaction.reply({
                embeds: [embed], components: [new Discord.MessageActionRow().addComponents(buttons)], fetchReply: true,
            });

            await InteractionRepliesManager.add(interaction, reply.id);
        },
    }));
}
