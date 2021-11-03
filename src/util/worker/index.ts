import path from "node:path";
import { Worker } from "node:worker_threads";
import { getDirname } from "../esm.js";

export function createWorker(worker_path: string): Worker {
    return new Worker(
        path.extname(__filename) === ".ts" ? path.resolve(__dirname, "./worker-portal.js") : worker_path.replace(/\.ts$/, ".js"),
        { workerData: { workerPath: worker_path } },
    );
}
