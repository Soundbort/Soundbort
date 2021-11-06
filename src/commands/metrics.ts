/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Discord from "discord.js";
import color from "color";
import os from "node:os";
import { time } from "@discordjs/builders";

import { BUTTON_TYPES, BUTTON_TYPES_NAMES, COLOR } from "../const.js";
import { BOT_NAME, VERSION } from "../config.js";

import InteractionRegistry from "../core/InteractionRegistry.js";
import { TopCommand } from "../modules/commands/TopCommand.js";
import { EmbedType, createEmbed, replyEmbedEphemeral } from "../util/builders/embed.js";
import { CmdInstallerArgs } from "../util/types.js";
import { CommandStringOption, createChoice } from "../modules/commands/CommandOption.js";

import { ChartOptionsData } from "../modules/charts/line.js";
import charts from "../modules/charts/index.js";

enum TimeWindowChoices {
    Day = "24 hours",
    ThreeDay = "3 days",
    Week = "week",
    Month = "4 weeks",
}

export function install({ stats_collector }: CmdInstallerArgs): void {
    InteractionRegistry.addCommand(new TopCommand({
        name: "metrics",
        description: "Display bot metrics and health statistics for anyone interested.",
        options: [
            new CommandStringOption({
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
        target: {
            global: true,
            guildHidden: false,
        },
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
            const stats = await stats_collector.getStats(time_window);

            if (stats.length === 0) {
                return replyEmbedEphemeral(`The bot hasn't collected any statistics in the last ${time_window_name}.`, EmbedType.Warning);
            }

            const aggregation = stats_collector.aggregateStatsArray(stats);

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

            const cpu_buffer = Buffer.from(await charts.lineGraph({
                data: cpu_data,
                title: "CPU Load Average",
                y: {
                    label_suffix: "%",
                },
            }));

            files.push(new Discord.MessageAttachment(cpu_buffer, "cpu_load_avg.png"));

            embeds.push(createEmbed(`**Last updated**: ${time(aggregation._id, "R")}`)
                .setAuthor(BOT_NAME, (interaction.client as Discord.Client<true>).user.avatarURL({ size: 32, dynamic: true }) || undefined)
                .addField("Bot Version", VERSION, true)
                .addField("Node.js Version", process.version.slice(1), true)
                .addField("Discord.js Version", Discord.version, true)

                .addField("Uptime", time(new Date(Date.now() - Math.round(process.uptime() * 1000)), "R"), true)

                .addField("Memory Usage", `${(aggregation.memory_usage * 100).toFixed(0)} %`, true)
                .addField("CPU Load Average", aggregation.cpu_load_avg.map(v => `${(v * 100).toFixed(0)} %`).join(" / "), true)
                .addField("CPU Cores", os.cpus().length.toLocaleString("en"), true)

                .setFooter(`${BOT_NAME} v${VERSION}`)
                .setImage("attachment://cpu_load_avg.png"));

            // GUILDS

            const guild_data: ChartOptionsData = {
                color: color(COLOR.PRIMARY, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.guilds,
                })),
            };

            const guild_buffer = Buffer.from(await charts.lineGraph({
                data: [guild_data],
            }));

            files.push(new Discord.MessageAttachment(guild_buffer, "guild.png"));

            embeds.push(createEmbed(undefined, EmbedType.Basic)
                .setTitle("Total Servers")
                .addField("Total Servers", interaction.client.guilds.cache.size.toLocaleString("en"), true)
                .addField("Total Large Servers", interaction.client.guilds.cache.filter(g => g.large).size.toLocaleString("en"), true)
                .setImage("attachment://guild.png"));

            // VOICE CONNECTIONS

            const vc_data: ChartOptionsData = {
                color: color(COLOR.WARNING, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.voice_connections,
                })),
            };

            const vc_buffer = Buffer.from(await charts.lineGraph({
                data: [vc_data],
            }));

            files.push(new Discord.MessageAttachment(vc_buffer, "voice_connections.png"));

            const top_voice_connections = Math.max(...stats.map(doc => doc.voice_connections));
            embeds.push(createEmbed(undefined, EmbedType.Warning)
                .setTitle("Connected Voice Channels")
                .addField("Active", aggregation.voice_connections.toLocaleString("en"), true)
                .addField(`Top ${time_window_name}`, top_voice_connections.toLocaleString("en"), true)
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

            const interactions_buffer = Buffer.from(await charts.lineGraph({
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
                .addField("Commands used", commands_used || "none", true)
                .addField("Buttons used", buttons_used || "none", true)
                .addField("Samples played", aggregation.played_samples.toLocaleString("en") + " played", true)
                .addField("Total User/Server Samples", aggregation.custom_samples.toLocaleString("en"), true));

            // PING

            const ping_data: ChartOptionsData = {
                color: color(COLOR.SUCCESS, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    y: doc.ping,
                })),
            };

            const ping_buffer = Buffer.from(await charts.lineGraph({
                data: [ping_data],
                y: {
                    label_suffix: "ms",
                },
            }));

            files.push(new Discord.MessageAttachment(ping_buffer, "ping.png"));

            embeds.push(createEmbed(undefined, EmbedType.Success)
                .setTitle("Ping")
                .addField("Last ping", interaction.client.ws.ping.toLocaleString("en") + " ms", true)
                .addField(`Average ping last ${time_window_name}`, Math.round(aggregation.ping).toLocaleString("en") + " ms", true)
                .setImage("attachment://ping.png"));

            return { embeds, files };
        },
    }));
}
