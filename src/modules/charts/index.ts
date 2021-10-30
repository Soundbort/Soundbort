import path from "node:path";
import { createWorker } from "../../util/worker";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

const worker = createWorker(path.resolve(__dirname, "worker.ts"));

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
