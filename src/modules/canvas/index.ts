/**
 * Because node-canvas is not context-aware, it has to be required from
 * a single thread only. I wanted to create individual threads for
 * the graphs and the audio waveform generator, but that was not possible.
 *
 * Therefore put all canvas stuff in one worker.
 */

import path from "node:path";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

import { createWorker } from "../../util/worker/index";

const worker = createWorker(path.resolve(__dirname, "worker.ts"));

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
