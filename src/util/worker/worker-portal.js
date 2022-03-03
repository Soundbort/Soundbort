/**
 * Portal file that portals the Typescript worker file through ts-node, because
 * Node.js only supports .js, .mjs, .cjs file extentions on Worker classes
 */

const { workerData } = require("node:worker_threads");

// Check if ts-node is already registered in this context
if (!process[Symbol.for("ts-node.register.instance")]) {
    require("ts-node").register();
}
// resolve to source dir
require(workerData.workerPath);
