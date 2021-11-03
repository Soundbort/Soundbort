import path from "node:path";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter.js";

import { createWorker } from "../../util/worker/index.js";
import { getDirname } from "../../util/esm.js";

const worker = createWorker(path.resolve(getDirname(import.meta.url), "worker.ts"));

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
