/**
 * Portal file that portals the Typescript worker file through ts-node, because
 * Node.js only supports .js, .mjs, .cjs file extentions on Worker classes
 */

const { workerData } = require("worker_threads");

require("ts-node").register();
// resolve to source dir
require(workerData.workerPath);
