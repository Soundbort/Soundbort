import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

export function createWorker(worker_url: URL): Worker {
    if (process.execArgv.includes("--loader")) {
        return new Worker(fileURLToPath(worker_url).replace(/\.js$/, ".ts"));
    }
    return new Worker(worker_url);
}
