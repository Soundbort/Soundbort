import Discord from "discord.js";
import color from "color";

import InteractionRegistry from "../core/InteractionRegistry";
import { BOT_NAME, VERSION } from "../config";
import { TopCommand } from "../modules/commands/TopCommand";
import { createEmbed } from "../util/util";
import { CmdInstallerArgs } from "../util/types";
import type { ChartOptionsData } from "../modules/charts/line";
import charts from "../modules/charts";
import { COLOR } from "../const";

export function install({ stats_collector }: CmdInstallerArgs): void {
    // -- metrics (incl ping with graphs usw)
    InteractionRegistry.addCommand(new TopCommand({
        name: "metrics",
        description: "Display bot metrics and health statistics for anyone interested.",
        async func(interaction) {
            const embed = createEmbed()
                .setFooter(`${BOT_NAME} v${VERSION}`)
                .setAuthor(BOT_NAME, (interaction.client as Discord.Client<true>).user.avatarURL({ size: 32, dynamic: true }) || undefined);

            // embed.addField("Banner", "![Banner](https://github.com/LonelessCodes/Soundbort/blob/main/assets/readme_banner.jpg)");

            const stats = await stats_collector.getStats(24 * 60 * 60 * 1000);

            const files: Discord.MessageAttachment[] = [];

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
                title: "Ping",
            }));

            files.push(new Discord.MessageAttachment(ping_buffer, "ping.png"));

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
                title: "Total Servers",
            }));

            files.push(new Discord.MessageAttachment(guild_buffer, "guild.png"));

            // PLAYED SAMPLES

            const samples_data: ChartOptionsData = {
                color: color(COLOR.ERROR, "rgb").string(),
                points: stats.map(doc => ({
                    x: doc._id.getTime(),
                    // y: Object.keys(doc.commands).reduce((acc, key) => acc + doc.commands[key], 0),
                    y: doc.played_samples,
                })),
            };

            const samples_buffer = Buffer.from(await charts.lineGraph({
                data: [samples_data],
                title: "Played Samples",
            }));

            files.push(new Discord.MessageAttachment(samples_buffer, "samples_played.png"));

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
                title: "Connected Voice Channels",
            }));

            files.push(new Discord.MessageAttachment(vc_buffer, "voice_connections.png"));

            // // test dataset code
            // const _data_start = Date.now();
            // const _data_delta = 60 * 1000;
            // const _time_window = 24 * 60 * 60 * 1000;

            // const data: ChartOptionsData = {
            //     color: color(COLOR.PRIMARY, "rgb").string(),
            //     points: new Array((_time_window / _data_delta) + 1)
            //         .fill({ x: 0, y: 0 })
            //         .map((val, index) => {
            //             return {
            //                 x: _data_start - _time_window + (index * _data_delta),
            //                 y: 100 + Math.floor(Math.random() * 40),
            //             };
            //         }),
            // };

            return { embeds: [embed], files };
        },
    }));
}
