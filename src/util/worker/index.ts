import path from "node:path";
import { Worker } from "node:worker_threads";

export function createWorker(worker_path: string): Worker {
    return new Worker(
        /\.ts$/.test(__filename) ? path.join(__dirname, "worker-portal.js") : worker_path.replace(/\.ts$/, ".js"),
        { workerData: { workerPath: worker_path } },
    );
}
