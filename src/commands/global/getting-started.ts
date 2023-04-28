import * as Discord from "discord.js";

import { BOT_NAME, VERSION } from "../../config.js";

import { CmdInstallerArgs } from "../../util/types.js";
import { createEmbed } from "../../util/builders/embed.js";
import { SlashCommand } from "../../modules/commands/SlashCommand.js";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions.js";

// TODO: format "/command" with Discord.chatInputApplicationCommandMention()

const gettingStartedDescription = (clientId: Discord.Snowflake) => `
__**So you've chosen ${BOT_NAME}. What now?**__

${BOT_NAME} is a soundboard bot for Discord with actual buttons to click. Add audio samples to \
**your personal** or **your server's soundboard** by uploading the audio file to a channel and \
then typing \`/upload\` and Discord will help you with the rest.
Type \`/list\` to see a list of samples you can already play.
More help can be found in the guide below.

📚 Getting Started Guide: [soundbort-guide.loneless.art](https://soundbort-guide.loneless.art/)
🆘 Support Server: [invite link](https://discord.gg/94MaVKtTPq)

📥 Invite: [invite link](https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2150943744&scope=bot%20applications.commands&redirect_uri=https%3A%2F%2Fsoundbort-guide.loneless.art%2F)
💸 Donate: [ko-fi.com/loneless](https://ko-fi.com/loneless)
👩‍💻 Contributing: [github.com/Soundbort/Soundbort](https://github.com/Soundbort/Soundbort)

🔒 Privacy notice and data deletion: [soundbort-guide.loneless.art/privacy](https://soundbort-guide.loneless.art/privacy)
`;

export function install({ client, registry }: CmdInstallerArgs): void {
    const embed = createEmbed()
        .setDescription(gettingStartedDescription(client.user.id))
        .setImage("https://raw.githubusercontent.com/Soundbort/Soundbort/main/assets/readme_banner.jpg")
        .setFooter({
            text: `${BOT_NAME} v${VERSION}`,
        })
        .setAuthor({
            name: BOT_NAME + " | Getting started",
            iconURL: client.user.avatarURL({ size: 32 }) || undefined,
        });

    registry.addCommand(new SlashCommand({
        name: "getting-started",
        description: `A getting-started guide that will help you find your way around ${BOT_NAME}.`,
        permissions: SlashCommandPermissions.GLOBAL,
        func() {
            return { embeds: [embed] };
        },
    }));
}
