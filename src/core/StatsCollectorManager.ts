import Discord from "discord.js";
import { EventEmitter } from "events";
import { CronJob } from "cron";
import http from "http";
import os from "os";

import database from "../modules/database";
import { StatsSchema } from "../modules/database/schemas/StatsSchema";
import Logger from "../log";
import { CustomSample } from "./soundboard/sample/CustomSample";
import { collectionStats } from "../modules/database/models";
import { METRICS_PORT } from "../config";
import { logErr } from "../util/util";

const log = Logger.child({ label: "Core => StatsCollectorManager" });

// setup a health monitoring server for Docker
// currently does nothing
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("ok");
});
server.listen(METRICS_PORT);

export class StatsCollectorManager extends EventEmitter {
    private job = new CronJob({
        cronTime: "0 */10 * * * *",
        onTick: () => this.collect().catch(error => log.error({ error: logErr(error) })),
    });

    private played_samples = 0;
    private commands: { [name: string]: number } = {};

    public client: Discord.Client<true>;

    constructor(client: Discord.Client<true>) {
        super();

        this.client = client;

        database.onConnect(() => this.job.start());
    }

    public incPlayedSamples(inc: number = 1): void {
        this.played_samples += inc;
    }

    public incCalledCommands(name: string, inc: number = 1): void {
        this.commands[name] = (this.commands[name] || 0) + inc;
    }

    public async collect(): Promise<void> {
        const ts = new Date();

        const guilds = this.client.guilds.cache.size;
        const voice_connections = this.client.guilds.cache.reduce((acc, curr) => acc + (curr.me?.voice.channelId ? 1 : 0), 0);

        // Set all command values to 0, so they can increment themselves later
        const commands = this.commands;
        this.commands = {};

        const custom_samples = await CustomSample.count();
        const played_samples = this.played_samples;
        this.played_samples = 0;

        const ping = this.client.ws.ping;
        const uptime = process.uptime();

        const cpu_load_avg = os.loadavg() as [number, number, number];
        const memory_usage = 1.0 - (os.freemem() / os.totalmem());

        const db_stats = await database.get().stats();

        const db = {
            collections: db_stats.collections,
            documents: db_stats.objects,
            storageSize: db_stats.storageSize,
            indexSize: db_stats.indexSize,
        };

        const doc: StatsSchema = {
            _id: ts,

            guilds,
            voice_connections,
            commands: commands,
            custom_samples,
            played_samples,

            ping,
            uptime,

            cpu_load_avg,
            memory_usage,

            database: db,
        };

        this.emit("collect", doc);

        await collectionStats().insertOne(
            doc,
        );
    }

    public getStats(timespan: number): Promise<StatsSchema[]> {
        const now = new Date();
        return collectionStats()
            .find({
                _id: {
                    $lte: now,
                    $gte: new Date(now.getTime() - timespan),
                },
            })
            .sort("_id", 1)
            .toArray();
    }
}
