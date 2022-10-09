import * as Discord from "discord.js";
import color from "color";
import os from "node:os";
import { time } from "@discordjs/builders";

import { BUTTON_TYPES, BUTTON_TYPES_NAMES, COLOR } from "../../const";
import { BOT_NAME, VERSION } from "../../config";

import StatsCollectorManager from "../../core/data-managers/StatsCollectorManager";

import { CmdInstallerArgs } from "../../util/types";
import { SlashCommand } from "../../modules/commands/SlashCommand";
import { SlashCommandPermissions } from "../../modules/commands/permission/SlashCommandPermissions";
import { EmbedType, createEmbed, replyEmbedEphemeral } from "../../util/builders/embed";
import { createStringOption } from "../../modules/commands/options/string";
import { createChoice } from "../../modules/commands/choice";

import { ChartOptionsData } from "../../modules/canvas/line-graph";
import canvas from "../../modules/canvas/index";

enum TimeWindowChoices {
    Day = "24 hours",
    ThreeDay = "3 days",
    Week = "week",
    Month = "4 weeks",
}

export function install({ registry }: CmdInstallerArgs): void {
    registry.addCommand(new SlashCommand({
        name: "metrics",
        description: "Display bot metrics and health statistics for anyone interested.",
        options: [
            createStringOption({
                name: "time_window",
                description: "The time window that's analyzed.",
                choices: [
                    createChoice("Last 24 hours", TimeWindowChoices.Day),
                    createChoice("Last 3 days", TimeWindowChoices.ThreeDay),
                    createChoice("Last week", TimeWindowChoices.Week),
                    createChoice("Last 4 weeks", TimeWindowChoices.Month),
                ],
            }),
        ],
        permissions: SlashCommandPermissions.GLOBAL,
        async func(interaction) {
            await interaction.deferReply();

            const embeds: Discord.MessageEmbed[] = [];
            const files: Discord.MessageAttachment[] = [];

            const time_window_name = interaction.options.getString("time_window", false) as (TimeWindowChoices | null) || TimeWindowChoices.Day;

            let time_window: number;
            switch (time_window_name) {
                case TimeWindowChoices.Day: time_window = 24 * 60 * 60 * 1000; break;
                case TimeWindowChoices.ThreeDay: time_window = 3 * 24 * 60 * 60 * 1000; break;
                case TimeWindowChoices.Week: time_window = 7 * 24 * 60 * 60 * 1000; break;
                case TimeWindowChoices.Month: time_window = 4 * 7 * 24 * 60 * 60 * 1000; break;
            }
            const stats = await StatsCollectorManager.getStats(time_window);

            if (stats.length === 0) {
                return replyEmbedEphemeral(`The bot hasn't collected any statistics in the last ${time_window_name}.`, EmbedType.Warning);
            }

            const aggregation = StatsCollectorManager.aggregateStatsArray(stats);

            const cpu_data: ChartOptionsData[] = [{
                color: color(COLOR.ERROR, "rgb").string(),
                label: "1 min",
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.cpu_load_avg[0] * 100,
                })),
            }, {
                color: color(COLOR.WARNING, "rgb").string(),
                label: "5 min",
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.cpu_load_avg[1] * 100,
                })),
            }, {
                color: color(COLOR.PRIMARY, "rgb").string(),
                label: "15 min",
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.cpu_load_avg[2] * 100,
                })),
            }];

            const cpu_buffer = Buffer.from(await canvas.lineGraph({
                data: cpu_data,
                title: "CPU Load Average",
                y: {
                    label_suffix: "%",
                },
            }));

            files.push(new Discord.MessageAttachment(cpu_buffer, "cpu_load_avg.png"));

            embeds.push(createEmbed(`**Last updated**: ${time(aggregation._id, "R")}`)
                .setAuthor({
                    name: BOT_NAME,
                    iconURL: (interaction.client as Discord.Client<true>).user.avatarURL({ size: 32, dynamic: true }) || undefined,
                })
                .addFields({
                    name: "Bot Version",
                    value: VERSION,
                    inline: true,
                }, {
                    name: "Node.js Version",
                    value: process.version.slice(1),
                    inline: true,
                }, {
                    name: "Discord.js Version",
                    value: Discord.version,
                    inline: true,
                }, {
                    name: "Uptime",
                    value: time(new Date(Date.now() - Math.round(process.uptime() * 1000)), "R"),
                    inline: true,
                }, {
                    name: "Memory Usage",
                    value: `${(aggregation.memory_usage * 100).toFixed(0)} %`,
                    inline: true,
                }, {
                    name: "CPU Load Average",
                    value: aggregation.cpu_load_avg.map(v => `${(v * 100).toFixed(0)} %`).join(" / "),
                    inline: true,
                }, {
                    name: "CPU Cores",
                    value: os.cpus().length.toLocaleString("en"),
                    inline: true,
                })
                .setFooter({
                    text: `${BOT_NAME} v${VERSION}`,
                })
                .setImage("attachment://cpu_load_avg.png"));

            // GUILDS

            const guild_data: ChartOptionsData = {
                color: color(COLOR.PRIMARY, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.guilds,
                })),
            };

            const guild_buffer = Buffer.from(await canvas.lineGraph({
                data: [guild_data],
            }));

            files.push(new Discord.MessageAttachment(guild_buffer, "guild.png"));

            embeds.push(createEmbed(undefined, EmbedType.Basic)
                .setTitle("Total Servers")
                .addFields({
                    name: "Total Servers",
                    value: interaction.client.guilds.cache.size.toLocaleString("en"),
                    inline: true,
                }, {
                    name: "Total Large Servers",
                    value: interaction.client.guilds.cache.filter(g => g.large).size.toLocaleString("en"),
                    inline: true,
                })
                .setImage("attachment://guild.png"));

            // VOICE CONNECTIONS

            const vc_data: ChartOptionsData = {
                color: color(COLOR.WARNING, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.voice_connections,
                })),
            };

            const vc_buffer = Buffer.from(await canvas.lineGraph({
                data: [vc_data],
            }));

            files.push(new Discord.MessageAttachment(vc_buffer, "voice_connections.png"));

            const top_voice_connections = Math.max(...stats.map(doc => doc.voice_connections));
            embeds.push(createEmbed(undefined, EmbedType.Warning)
                .setTitle("Connected Voice Channels")
                .addFields({
                    name: "Active",
                    value: aggregation.voice_connections.toLocaleString("en"),
                    inline: true,
                }, {
                    name: `Top ${time_window_name}`,
                    value: top_voice_connections.toLocaleString("en"),
                    inline: true,
                })
                .setImage("attachment://voice_connections.png"));

            // INTERACTIONS

            const commands_data: ChartOptionsData = {
                color: color(COLOR.ERROR, "rgb").string(),
                label: "Commands called",
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    // y: doc.played_samples,
                    y: Object.keys(doc.commands).reduce((acc, key) => acc + doc.commands[key], 0),
                })),
            };
            const buttons_data: ChartOptionsData = {
                color: color(COLOR.PRIMARY, "rgb").string(),
                label: "Buttons clicked",
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: Object.keys(doc.buttons).reduce((acc, key) => acc + doc.buttons[key], 0),
                })),
            };

            const interactions_buffer = Buffer.from(await canvas.lineGraph({
                data: [commands_data, buttons_data],
            }));

            files.push(new Discord.MessageAttachment(interactions_buffer, "samples_played.png"));

            const commands_used = Object.keys(aggregation.commands)
                .sort((a, b) => aggregation.commands[b] - aggregation.commands[a])
                .map(name => {
                    return `**${name}**: ${aggregation.commands[name].toLocaleString("en")}`;
                })
                .join("\n");
            const buttons_used = Object.keys(aggregation.buttons)
                .sort((a, b) => aggregation.buttons[b] - aggregation.buttons[a])
                .map(type => {
                    return `**${BUTTON_TYPES_NAMES[type as BUTTON_TYPES]}**: ${aggregation.buttons[type].toLocaleString("en")}`;
                })
                .join("\n");

            embeds.push(createEmbed(undefined, EmbedType.Error)
                .setTitle(`Interactions in the last ${time_window_name}`)
                .setImage("attachment://samples_played.png")
                .addFields({
                    name: "Commands used",
                    value: commands_used || "none",
                    inline: true,
                }, {
                    name: "Buttons used",
                    value: buttons_used || "none",
                    inline: true,
                }, {
                    name: "Samples played",
                    value: aggregation.played_samples.toLocaleString("en") + " played",
                    inline: true,
                }, {
                    name: "Total User/Server Samples",
                    value: aggregation.custom_samples.toLocaleString("en"),
                    inline: true,
                }));

            // PING

            const ping_data: ChartOptionsData = {
                color: color(COLOR.SUCCESS, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.ping,
                })),
            };

            const ping_buffer = Buffer.from(await canvas.lineGraph({
                data: [ping_data],
                y: {
                    label_suffix: "ms",
                },
            }));

            files.push(new Discord.MessageAttachment(ping_buffer, "ping.png"));

            embeds.push(createEmbed(undefined, EmbedType.Success)
                .setTitle("Ping")
                .addFields({
                    name: "Last ping",
                    value: interaction.client.ws.ping.toLocaleString("en") + " ms",
                    inline: true,
                }, {
                    name: `Average ping last ${time_window_name}`,
                    value: Math.round(aggregation.ping).toLocaleString("en") + " ms",
                    inline: true,
                })
                .setImage("attachment://ping.png"));

            return { embeds, files };
        },
    }));
}
