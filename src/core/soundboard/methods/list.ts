import Discord from "discord.js";
import { BUTTON_IDS } from "../../../const";
import { createEmbed, EmbedType, replyEmbedEphemeral } from "../../../util/util";
import { CustomSample, AvailableCustomSamplesResponse } from "../sample/CustomSample";
import { PredefinedSample } from "../sample/PredefinedSample";

interface AvailableSamplesResponse extends AvailableCustomSamplesResponse {
    standard: PredefinedSample[];
}

async function getAllAvailableSamples(guildId: Discord.Snowflake | null, userId: Discord.Snowflake): Promise<AvailableSamplesResponse> {
    const { user, guild } = guildId
        ? { user: await CustomSample.getUserSamples(userId), guild: await CustomSample.getGuildSamples(guildId) }
        : { user: await CustomSample.getUserSamples(userId), guild: [] };

    const standard = await PredefinedSample.getSamples();

    return {
        total: user.length + guild.length,
        user: user,
        guild: guild,
        standard: standard,
    };
}

function generateSampleButtons(samples: CustomSample[] | PredefinedSample[]): Discord.MessageActionRow[] {
    const rows: Discord.MessageActionRow[] = [];
    let i = 0;

    for (const sample of samples) {
        const button = new Discord.MessageButton()
            .setCustomId(sample instanceof CustomSample ? BUTTON_IDS.CUSTOM_PLAY + sample.id : BUTTON_IDS.PREDEF_PLAY + sample.name)
            .setLabel(sample.name)
            .setStyle("PRIMARY");

        const row = Math.floor(i / 5);
        if (!rows[row]) rows[row] = new Discord.MessageActionRow();

        rows[row].addComponents(button);

        i++;
    }

    return rows;
}

async function scopeAll(interaction: Discord.CommandInteraction): Promise<void> {
    const client = interaction.client as Discord.Client<true>;
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const samples = await getAllAvailableSamples(guildId, userId);

    const reply = (opts: Discord.InteractionReplyOptions) => {
        return interaction.replied ? interaction.channel?.send(opts) : interaction.reply(opts);
    };

    if (samples.standard.length > 0) {
        const rows = generateSampleButtons(samples.standard);

        const embed = createEmbed()
            .setAuthor("Standard Samples", client.user.avatarURL({ dynamic: true, size: 32 }) || undefined)
            .setDescription("Join a voice channel and click on one of the buttons below. ✨");

        await reply({ embeds: [embed], components: rows });
    }

    if (samples.total === 0) {
        await reply(replyEmbedEphemeral("You don't have any sound clips in your soundboard. Add them with `/upload`.", EmbedType.Info));
        return;
    }

    if (samples.guild.length > 0 && interaction.guild) {
        const rows = generateSampleButtons(samples.guild);

        const embed = createEmbed()
            .setAuthor(`${interaction.guild.name}'s Server Samples`, interaction.guild.iconURL({ dynamic: true, size: 32 }) || undefined);

        await reply({ embeds: [embed], components: rows });
    }

    if (samples.user.length > 0) {
        const rows = generateSampleButtons(samples.user);

        const embed = createEmbed()
            .setAuthor(`${interaction.user.username}'s Samples`, interaction.user.avatarURL({ dynamic: true, size: 32 }) || undefined);

        await reply({ embeds: [embed], components: rows });
    }
}

async function scopeServer(interaction: Discord.CommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const samples = await getAllAvailableSamples(guildId, userId);

    if (!interaction.guild) {
        return interaction.reply(replyEmbedEphemeral("Call this command in a server to get the server list.", EmbedType.Error));
    }

    if (samples.guild.length === 0) {
        return interaction.reply(replyEmbedEphemeral("Your server doesn't have any sound clips in its soundboard. Add them with `/upload`.", EmbedType.Info));
    }

    const rows = generateSampleButtons(samples.guild);

    const embed = createEmbed()
        .setAuthor(`${interaction.guild.name}'s Server Samples`, interaction.guild.iconURL({ dynamic: true, size: 32 }) || undefined)
        .setDescription("Join a voice channel and click on one of the buttons below. ✨");

    await interaction.reply({ embeds: [embed], components: rows });
}

async function scopeUser(interaction: Discord.CommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    const samples = await getAllAvailableSamples(guildId, userId);

    if (samples.user.length === 0) {
        return await interaction.reply(replyEmbedEphemeral("You don't have any sound clips in your soundboard. Add them with `/upload`.", EmbedType.Info));
    }

    const rows = generateSampleButtons(samples.user);

    const embed = createEmbed()
        .setAuthor(`${interaction.user.username}'s Samples`, interaction.user.avatarURL({ dynamic: true, size: 32 }) || undefined)
        .setDescription("Join a voice channel and click on one of the buttons below. ✨");

    await interaction.reply({ embeds: [embed], components: rows });
}

export async function list(interaction: Discord.CommandInteraction, scope: "user" | "server" | "all"): Promise<void> {
    if (scope === "all") await scopeAll(interaction);
    else if (scope === "server") await scopeServer(interaction);
    else if (scope === "user") await scopeUser(interaction);
}
