/**
 * Because node-canvas is not context-aware, it has to be required from
 * a single thread only. I wanted to create individual threads for
 * the graphs and the audio waveform generator, but that was not possible.
 *
 * Therefore put all canvas stuff in one worker.
 */

import * as Comlink from "comlink";

import nodeEndpoint from "../../util/worker/node-adapter.js";
import { createWorker } from "../../util/worker/index.js";

const worker = createWorker(new URL("worker.js", import.meta.url));

export default Comlink.wrap<import("./worker.js").WorkerAPI>(nodeEndpoint(worker)); // ? unfortunately comlink types do not work well for nodejs esm
