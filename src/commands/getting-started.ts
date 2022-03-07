import { BOT_NAME, VERSION } from "../config";

import { CmdInstallerArgs } from "../util/types";
import { createEmbed } from "../util/builders/embed";
import { TopCommand } from "../modules/commands/TopCommand";
import InteractionRegistry from "../core/InteractionRegistry";

export function install({ client }: CmdInstallerArgs): void {
    const invite_link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=2150943744&scope=bot%20applications.commands&redirect_uri=https%3A%2F%2Fsoundbort-guide.loneless.art%2F`;

    const embed = createEmbed()
        .setDescription(
            "__**So you've chosen Soundbort. What now?**__\n" +
            "\n" +
            "Soundbort is a soundboard bot for Discord with actual buttons to click. Add audio samples " +
            "to **your personal** or **your server's soundboard** by uploading the audio file to a " +
            "channel and then typing `/upload` and Discord will help you with the rest.\n" +
            "Type `/list` to see a list of samples you can already play.\n" +
            "More help can be found in the guide below.\n" +
            "\n" +
            ":books: Getting Started Guide: [soundbort-guide.loneless.art](https://soundbort-guide.loneless.art/)\n" +
            "\n" +
            `:inbox_tray: Invite: [invite link](${invite_link})\n` +
            ":money_with_wings: Donate: [ko-fi.com/loneless](https://ko-fi.com/loneless)\n" +
            ":woman_technologist: Contributing: [github.com/LonelessCodes/Soundbort](https://github.com/LonelessCodes/Soundbort)\n" +
            "\n" +
            "🔒 Privacy notice and data deletion: [soundbort-guide.loneless.art/privacy](https://soundbort-guide.loneless.art/privacy)",
        )
        .setImage("https://raw.githubusercontent.com/LonelessCodes/Soundbort/main/assets/readme_banner.jpg")
        .setFooter({
            text: `${BOT_NAME} v${VERSION}`,
        })
        .setAuthor({
            name: BOT_NAME + " | Getting started",
            iconURL: client.user.avatarURL({ size: 32, dynamic: true }) || undefined,
        });

    InteractionRegistry.addCommand(new TopCommand({
        name: "getting-started",
        description: `A getting-started guide that will help you find your way around ${BOT_NAME}.`,
        target: {
            global: true,
            guildHidden: false,
        },
        func() {
            return { embeds: [embed] };
        },
    }));
}
