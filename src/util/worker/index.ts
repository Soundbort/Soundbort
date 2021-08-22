import path from "path";
import { Worker } from "worker_threads";

export function createWorker(worker_path: string): Worker {
    return new Worker(
        path.extname(__filename) === ".ts" ? path.resolve(__dirname, "./worker-portal.js") : worker_path.replace(/\.ts$/, ".js"),
        { workerData: { workerPath: worker_path } },
    );
}
