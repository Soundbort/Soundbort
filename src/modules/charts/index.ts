import path from "path";
import { Worker } from "worker_threads";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

const worker = new Worker(
    path.join(__dirname, path.extname(__filename) === ".ts" ? "worker-portal.js" : "worker.js"),
    { workerData: { workerPath: "./worker" } },
);

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
