import Discord from "discord.js";
import { TypedEmitter } from "tiny-typed-emitter";
import http from "node:http";
import os from "node:os";
import { promisify } from "node:util";

import Logger from "../../log";

import * as database from "../../modules/database/index";
import * as models from "../../modules/database/models";
import { StatsSchema } from "../../modules/database/schemas/StatsSchema";
import { CustomSample } from "../soundboard/CustomSample";
import { METRICS_PORT } from "../../config";
import { lastItem } from "../../util/array";
import { onExit } from "../../util/exit";

const log = Logger.child({ label: "Core => StatsCollectorManager" });

interface StatsCollectorManagerEvents {
    collect(doc: StatsSchema): void;
}

class StatsCollectorManager extends TypedEmitter<StatsCollectorManagerEvents> {
    private played_samples = 0;
    private commands: { [name: string]: number } = {};
    private buttons: { [type: string]: number } = {};

    private metricsServerListener: http.RequestListener = (req, res) => {
        res.writeHead(200);
        res.end("ok");
    };

    // setup a health monitoring server for Docker
    // currently does nothing
    private server = http.createServer(this.metricsServerListener);

    constructor() {
        super();

        onExit(this.stop);
    }

    public async stop(): Promise<void> {
        log.debug("Closing health monitor server...");
        await promisify(this.server.close)();
    }

    public listen(): void {
        this.server.listen(METRICS_PORT);
    }

    // /////////////////

    public incPlayedSamples(inc: number = 1): void {
        this.played_samples += inc;
    }

    public incCalledCommands(name: string, inc: number = 1): void {
        this.commands[name] = (this.commands[name] || 0) + inc;
    }

    public incCalledButtons(type: string, inc: number = 1): void {
        this.buttons[type] = (this.buttons[type] || 0) + inc;
    }

    public async collect(client: Discord.Client<true>): Promise<void> {
        const ts = new Date(Math.floor(Date.now() / 1000) * 1000); // round timestamp to the second

        const guilds = client.guilds.cache.size;
        const voice_connections = client.guilds.cache.reduce((acc, curr) => acc + (curr.me?.voice.channelId ? 1 : 0), 0);

        // Set all command values to 0, so they can increment themselves later
        const commands = this.commands;
        this.commands = {};
        const buttons = this.buttons;
        this.buttons = {};

        const custom_samples = await CustomSample.count();
        const played_samples = this.played_samples;
        this.played_samples = 0;

        const ping = client.ws.ping;
        const uptime = process.uptime();

        const cpu_load_avg = os.loadavg() as [number, number, number];
        const memory_usage = 1 - (os.freemem() / os.totalmem());

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
            buttons: buttons,
            custom_samples,
            played_samples,

            ping,
            uptime,

            cpu_load_avg,
            memory_usage,

            database: db,
        };

        this.emit("collect", doc);

        await models.stats.insertOne(doc);
    }

    public getStats(timespan: number | Date): Promise<StatsSchema[]> {
        const now = new Date();
        return models.stats
            .find({
                _id: {
                    $lte: now,
                    $gt: timespan instanceof Date
                        ? timespan
                        : new Date(now.getTime() - timespan - (10 * 60 * 1000)),
                },
            })
            .sort("_id", 1)
            .toArray();
    }

    public aggregateStatsArray(docs: StatsSchema[]): StatsSchema {
        const commands = docs.reduce<StatsSchema["commands"]>((acc, curr) => {
            for (const key in curr.commands) {
                acc[key] = (acc[key] || 0) + curr.commands[key];
            }
            return acc;
        }, {});
        const buttons = docs.reduce<Required<StatsSchema>["buttons"]>((acc, curr) => {
            for (const key in curr.buttons) {
                acc[key] = (acc[key] || 0) + curr.buttons[key];
            }
            return acc;
        }, {});

        const played_samples = docs.reduce((acc, curr) => acc + curr.played_samples, 0);
        const ping = docs.reduce((acc, curr) => acc + curr.ping, 0) / docs.length;

        const result = {
            ...lastItem(docs),
            commands,
            buttons,
            ping,
            played_samples,
        };

        return result;
    }

    public aggregateCummulativeStats(since: Date): Promise<StatsSchema>
    public aggregateCummulativeStats(timespan: number): Promise<StatsSchema>
    public async aggregateCummulativeStats(timespan: number | Date): Promise<StatsSchema> {
        // refactor this to use the MongoDb aggregation pipeline at some point

        const docs = await this.getStats(timespan);

        return this.aggregateStatsArray(docs);
    }
}

export default new StatsCollectorManager();
