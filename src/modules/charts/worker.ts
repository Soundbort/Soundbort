/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { parentPort } from "node:worker_threads";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter.js";
import Logger from "../../log.js";
import { lineGraph } from "./line.js";

const log = Logger.child({ label: "Charts => Worker" });

const api = {
    lineGraph,
};
Comlink.expose(api, nodeEndpoint(parentPort!));

log.info("Ready.");

export type WorkerAPI = typeof api;
