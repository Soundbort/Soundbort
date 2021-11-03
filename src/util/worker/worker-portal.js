/**
 * Portal file that portals the Typescript worker file through ts-node, because
 * Node.js only supports .js, .mjs, .cjs file extentions on Worker classes
 */

import { workerData } from "node:worker_threads";

(await import("ts-node")).register();
// resolve to source dir
await import(workerData.workerPath);
