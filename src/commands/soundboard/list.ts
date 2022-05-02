import * as Discord from "discord.js";

import InteractionRegistry from "../../core/InteractionRegistry";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { createStringOption } from "../../modules/commands/options/string";
import { createChoice } from "../../modules/commands/choice";
import { SimpleFuncReturn } from "../../modules/commands/AbstractSharedCommand";
import { EmbedType, createEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import { BUTTON_TYPES, SAMPLE_TYPES } from "../../const";
import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";

function generateSampleButtons(samples: CustomSample[] | StandardSample[]): Discord.MessageActionRow[] {
    const rows: Discord.MessageActionRow[] = [];
    let i = 0;

    for (const sample of samples) {
        const button = new Discord.MessageButton()
            .setCustomId(sample instanceof CustomSample
                ? InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_CUSTOM, id: sample.id })
                : InteractionRegistry.encodeButtonId({ t: BUTTON_TYPES.PLAY_STANDA, n: sample.name }),
            )
            .setLabel(sample.name)
            .setStyle("PRIMARY");

        const row = Math.floor(i / 5);
        if (!rows[row]) rows[row] = new Discord.MessageActionRow();

        rows[row].addComponents(button);

        i++;
    }

    return rows;
}

function generateSampleMessage(
    samples: CustomSample[] | StandardSample[],
    title: string,
    iconUrl: string | null,
    slots?: number,
    joinNotice: boolean = true,
): Discord.InteractionReplyOptions {
    const rows = generateSampleButtons(samples);

    const embed = createEmbed().setAuthor({
        name: title,
        iconURL: iconUrl ?? undefined,
    });
    if (joinNotice) embed.setDescription("Join a voice channel and click on one of the buttons below. ✨");
    if (slots) embed.setFooter({
        text: `Slots: ${samples.length} / ${slots} used.` +
            ((slots < CustomSample.MAX_SLOTS) ? " See /vote to get more slots" : ""),
    });

    return { embeds: [embed], components: rows };
}

async function scopeAll(interaction: Discord.CommandInteraction): Promise<void> {
    const client = interaction.client as Discord.Client<true>;

    const standard_samples = await StandardSample.getSamples();
    const guild_samples = interaction.guildId ? await CustomSample.getGuildSamples(interaction.guildId) : [];
    const user_samples = await CustomSample.getUserSamples(interaction.user.id);

    const guild_slots = interaction.guildId ? await CustomSample.countSlots(interaction.guildId) : 0;
    const user_slots = await CustomSample.countSlots(interaction.user.id);

    const reply = (opts: Discord.InteractionReplyOptions) => {
        return interaction.replied ? interaction.channel?.send(opts) : interaction.reply(opts);
    };

    if (standard_samples.length > 0) {
        await reply(generateSampleMessage(
            standard_samples, "Standard Samples", client.user.avatarURL({ dynamic: true, size: 32 }),
        ));
    }

    if (user_samples.length + guild_samples.length === 0) {
        await reply(replyEmbedEphemeral("You don't have any sound clips in your soundboard. Add them with `/upload`.", EmbedType.Info));
        return;
    }

    if (guild_samples.length > 0 && interaction.guild) {
        await reply(generateSampleMessage(
            guild_samples, `${interaction.guild.name}'s Server Samples`, interaction.guild.iconURL({ dynamic: true, size: 32 }), guild_slots, false,
        ));
    }

    if (user_samples.length > 0) {
        await reply(generateSampleMessage(
            user_samples, `${interaction.user.username}'s Samples`, interaction.user.avatarURL({ dynamic: true, size: 32 }), user_slots, false,
        ));
    }
}

async function scopeStandard(interaction: Discord.CommandInteraction): Promise<SimpleFuncReturn> {
    const client = interaction.client as Discord.Client<true>;

    const standard = await StandardSample.getSamples();

    if (standard.length === 0) {
        return replyEmbedEphemeral("There are no standard samples yet. Ask a developer to add them.", EmbedType.Info);
    }

    return generateSampleMessage(
        standard, "Standard Samples", client.user.avatarURL({ dynamic: true, size: 32 }),
    );
}

async function scopeServer(interaction: Discord.CommandInteraction): Promise<SimpleFuncReturn> {
    if (!interaction.inCachedGuild()) {
        return replyEmbedEphemeral("Call this command in a server to get the server list.", EmbedType.Error);
    }

    const samples = await CustomSample.getGuildSamples(interaction.guildId);
    const slots = await CustomSample.countSlots(interaction.guildId);

    if (samples.length === 0) {
        return replyEmbedEphemeral("Your server doesn't have any sound clips in its soundboard. Add them with `/upload`.", EmbedType.Info);
    }

    return generateSampleMessage(
        samples, `${interaction.guild.name}'s Server Samples`, interaction.guild.iconURL({ dynamic: true, size: 32 }), slots,
    );
}

async function scopeUser(interaction: Discord.CommandInteraction): Promise<SimpleFuncReturn> {
    const samples = await CustomSample.getUserSamples(interaction.user.id);
    const slots = await CustomSample.countSlots(interaction.user.id);

    if (samples.length === 0) {
        return replyEmbedEphemeral("You don't have any sound clips in your soundboard. Add them with `/upload`.", EmbedType.Info);
    }

    return generateSampleMessage(
        samples, `${interaction.user.username}'s Samples`, interaction.user.avatarURL({ dynamic: true, size: 32 }), slots,
    );
}

InteractionRegistry.addCommand(new SlashCommand({
    name: "list",
    description: "Generate a list of all accessable samples with clickable buttons to trigger them.",
    options: [
        createStringOption({
            name: "from",
            description: "What soundboards to output.",
            choices: [
                createChoice("Output all soundboards (standard, server and user soundboards).", "all"),
                createChoice("Output standard soundboard only.", SAMPLE_TYPES.STANDARD),
                createChoice("Output this server's soundboard only.", SAMPLE_TYPES.SERVER),
                createChoice("Output your own soundboard only.", SAMPLE_TYPES.USER),
            ],
        }),
    ],
    permissions: SlashCommandPermissions.EVERYONE,
    func(interaction) {
        const scope = interaction.options.getString("from") as ("all" | SAMPLE_TYPES.STANDARD | SAMPLE_TYPES.SERVER | SAMPLE_TYPES.USER | null) || "all";

        if (scope === SAMPLE_TYPES.STANDARD) return scopeStandard(interaction);
        if (scope === SAMPLE_TYPES.SERVER) return scopeServer(interaction);
        if (scope === SAMPLE_TYPES.USER) return scopeUser(interaction);
        return scopeAll(interaction);
    },
}));
