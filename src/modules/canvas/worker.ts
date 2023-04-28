// Power to the workers
import { parentPort } from "node:worker_threads";
import * as Comlink from "comlink";

import Logger from "../../log.js";
import { visualizeAudio } from "./visualize-audio.js";
import { lineGraph } from "./line-graph.js";
import nodeEndpoint from "../../util/worker/node-adapter.js";

const log = Logger.child({ label: "Canvas => Worker" });

const api = {
    visualizeAudio,
    lineGraph,
};
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
Comlink.expose(api, nodeEndpoint(parentPort!));

log.info("Ready.");

export type WorkerAPI = typeof api;
