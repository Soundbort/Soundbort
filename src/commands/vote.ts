import { userMention } from "@discordjs/builders";
import Discord from "discord.js";

import { BOT_NAME, TOP_GG_WEBHOOK_TOKEN } from "../config";
import InteractionRegistry from "../core/InteractionRegistry";
import { CustomSample } from "../core/soundboard/CustomSample";
import { TopCommand } from "../modules/commands/TopCommand";
import { SingleSoundboardSlot } from "../modules/database/schemas/SoundboardSlotsSchema";
import { CmdInstallerArgs } from "../util/types";
import { createEmbed, EmbedType, replyEmbed } from "../util/util";

if (TOP_GG_WEBHOOK_TOKEN) {
    InteractionRegistry.addCommand(new TopCommand({
        name: "vote",
        description: "Upvote Soundbort on top.gg to get more sample slots for your or someone else's soundboard.",
        async func(interaction) {
            const refId = interaction.id;
            const client = interaction.client as Discord.Client<true>;
            const vote_base_link = `https://top.gg/bot/868296331234521099/vote?ref=${refId}`;

            const embed = createEmbed()
                .setAuthor(BOT_NAME + " | Voting", client.user.avatarURL({ size: 32, dynamic: true }) || undefined)
                .setDescription(
                    "To get more slots for your soundboard you can upvote the bot through the links below.\n" +
                    "Other users can use these links as well to give you or this server more slots.\n" +
                    "One vote equals one slot. On weekends you get two slots! " +
                    `A soundboard can't have more than ${CustomSample.MAX_SLOTS} slots.`,
                );

            // label text max 80 characters

            const formatEllipsis = (base: string, insert: string, length: number) => {
                const leftover_length = length - base.length + 1;
                if (insert.length > leftover_length) {
                    insert = insert.substring(0, leftover_length - 3) + "...";
                }
                return base.replace("%", insert);
            };

            const user = interaction.user;
            const user_vote_link = vote_base_link + "&userId=" + user.id;
            const user_label = formatEllipsis("Get slots for %", user.tag, 80);
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
                const guild_label = formatEllipsis("Get slots for Server '%'", guild.name, 80);
                buttons.push(
                    new Discord.MessageButton()
                        .setLabel(guild_label)
                        .setEmoji("🗳️")
                        .setURL(guild_vote_link)
                        .setStyle("LINK"),
                );
            }

            await interaction.reply({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents(buttons)] });
        },
    }));
}
