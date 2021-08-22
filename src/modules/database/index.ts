import { Awaited } from "discord.js";
import { Db, Collection, MongoClient } from "mongodb";

import { BOT_NAME, DB_URI } from "../../config";
import Logger from "../../log";
import { logErr } from "../../util/util";

export type QueueFunction = () => Awaited<void>;

const log = Logger.child({ label: "database" });

let client: MongoClient | undefined;
let database: Db | undefined;

// Queue of Functions to call first when connected to DBMS
const queue: QueueFunction[] = [];

export async function connect(): Promise<MongoClient> {
    log.info("Connecting to database...");

    client = await MongoClient.connect(DB_URI, {
        appName: BOT_NAME,
    });
    database = client.db();

    for (const func of queue) {
        try {
            await func();
        } catch (error) {
            log.warn("Error in db.onConnect function", { error: logErr(error) });
        }
    }

    // clear the queue to garbage collect the functions
    queue.splice(0, queue.length);

    log.info("Connected");

    return client;
}

export function onConnect(func: QueueFunction): void {
    if (!database) queue.push(func);
    else {
        Promise.resolve(func())
            .catch(error => {
                log.warn("Error in db.onConnect function", { error: logErr(error) });
            });
    }
}

export function get(): Db {
    if (!database) throw new Error("Connect to MongoDB first");

    return database;
}

export function collection<T>(name: string): Collection<T> {
    return get().collection<T>(name);
}

export async function close(): Promise<void> {
    await client?.close();
}
