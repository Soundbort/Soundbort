import { BOT_NAME } from "../config";

import InteractionRegistry from "../core/InteractionRegistry";
import { createEmbed, EmbedType, replyEmbed } from "../util/builders/embed";
import { ApplicationCommandOptionChoice, CommandNumberOption, CommandRoleOption } from "../modules/commands/CommandOption";
import { TopCommandGroup } from "../modules/commands/TopCommandGroup";
import { Command } from "../modules/commands/Command";

import GuildConfigManager from "../core/data-managers/GuildConfigManager";

const admin_role_cmd = new Command({
    name: "admin-role",
    description: `Set the (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
    options: [
        new CommandRoleOption({
            name: "role",
            description: `The (admin) role ${BOT_NAME} uses to allow / disallow access to admin commands.`,
            required: true,
        }),
    ],
    async func(interaction) {
        if (!interaction.inCachedGuild() || !await GuildConfigManager.isModerator(interaction.guild, interaction.user.id)) {
            return;
        }

        const role = interaction.options.getRole("role", true);

        await GuildConfigManager.setAdminRole(interaction.guild, role.id);

        return replyEmbed("Set the role!", EmbedType.Success);
    },
});

// create an array of option choices in the interval of (0.0, 1.0]
// sorted biggest to smallest
const volume_steps_num = 10;
// didn't know this was the way to create an array, but unicorn tells me to prefer this over `new Array(length)`
const volume_steps: ApplicationCommandOptionChoice<number>[] = Array.from({ length: volume_steps_num });
const volume_steps_diff = 100 / volume_steps_num;
for (let i = volume_steps_num; i > 0; i--) {
    volume_steps[volume_steps_num - i] = {
        value: i / volume_steps_num,
        name: `${Math.floor(i * volume_steps_diff)}%`,
    };
}

const volume_cmd = new Command({
    name: "volume",
    description: `Set ${BOT_NAME}'s loudness in voice channels.`,
    options: [
        new CommandNumberOption({
            name: "level",
            description: `The loudness level of ${BOT_NAME} in voice channels`,
            required: true,
            choices: volume_steps,
        }),
    ],
    async func(interaction) {
        if (!interaction.inCachedGuild() || !await GuildConfigManager.isModerator(interaction.guild, interaction.user.id)) {
            return;
        }

        const volume = interaction.options.getNumber("level", true);

        await GuildConfigManager.setVolume(interaction.guild, volume);

        return replyEmbed(`Volume set to ${Math.floor(volume * 100)}%!`, EmbedType.Success);
    },
});

const show_cmd = new Command({
    name: "show",
    description: `Shows the configuration of ${BOT_NAME} in this server.`,
    async func(interaction) {
        if (!interaction.inCachedGuild()) return;

        const config = await GuildConfigManager.findOrGenerateConfig(interaction.guild);
        const role = await interaction.guild.roles.fetch(config.adminRoleId);
        const volume = `${Math.floor(config.volume * 100)}%`;

        const embed = createEmbed(undefined, EmbedType.Info)
            .setAuthor({
                name: `${interaction.guild.name} | ${BOT_NAME} Config`,
                iconURL: interaction.guild.iconURL({ size: 32 }) ?? undefined,
            })
            .addField("Admin Role", `${role?.toString()}`, true)
            .addField("Volume", volume, true);

        return { embeds: [embed] };
    },
});

InteractionRegistry.addCommand(new TopCommandGroup({
    name: "config",
    description: `Configure ${BOT_NAME} for your server.`,
    commands: [
        admin_role_cmd,
        volume_cmd,
        show_cmd,
    ],
    target: {
        global: false,
        guildHidden: false,
    },
}));
