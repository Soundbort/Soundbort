import path from "node:path";
import { Worker } from "node:worker_threads";

import { getDirname } from "../esm.js";

export function createWorker(worker_path: string): Worker {
    return new Worker(
        /\.ts$/.test(import.meta.url) ? path.resolve(getDirname(import.meta.url), "./worker-portal.js") : worker_path.replace(/\.ts$/, ".js"),
        { workerData: { workerPath: worker_path } },
    );
}
