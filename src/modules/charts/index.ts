import path from "path";
import { createWorker } from "../worker/createWorker";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

const worker = createWorker(path.resolve(__dirname, "worker.ts"));

export default Comlink.wrap<import("./worker").WorkerAPI>(nodeEndpoint(worker));
