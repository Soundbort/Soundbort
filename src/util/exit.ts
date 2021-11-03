import temp from "temp";
import { Awaitable } from "discord.js";
import Logger from "../log.js";

temp.track();

const log = Logger.child({ label: "Util => Exit" });

type ExitHandler = () => Awaitable<void>;

const handlers: ExitHandler[] = [];

export function onExit(handler: ExitHandler): void {
    handlers.push(handler);
}

export function exit(code = 0): void {
    log.info("Gracefully exiting...");

    log.debug("Deleting temporary files...");
    temp.cleanupSync();

    Promise.allSettled(handlers.map(h => h()))
        .finally(() => process.exit(code));
}
