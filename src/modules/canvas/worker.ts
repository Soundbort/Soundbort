// Power to the workers
import { parentPort } from "node:worker_threads";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

import Logger from "../../log";
import { visualizeAudio } from "./visualize-audio";
import { lineGraph } from "./line-graph";

const log = Logger.child({ label: "Canvas => Worker" });

const api = {
    visualizeAudio,
    lineGraph,
};
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
Comlink.expose(api, nodeEndpoint(parentPort!));

log.info("Ready.");

export type WorkerAPI = typeof api;
