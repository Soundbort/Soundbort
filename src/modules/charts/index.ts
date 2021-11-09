import path from "node:path";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

import { createWorker } from "../../util/worker/index";

const worker = createWorker(path.resolve(__dirname, "worker.ts"));

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
