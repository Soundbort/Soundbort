import express from "express";
import http from "node:http";
import { promisify } from "node:util";

import Logger from "../../log.js";
import { WEBHOOK_PORT } from "../../config.js";
import { onExit } from "../../util/exit.js";
import VotesManager from "../data-managers/VotesManager.js";

const log = Logger.child({ label: "Core => WebhookManager" });

let server: http.Server | undefined;

onExit(async () => {
    if (!server) return;

    log.debug("Closing webhook server...");
    await promisify(server.close)();
});

class WebhookManager {
    private app: express.Express;

    constructor() {
        this.app = express();

        // eslint-disable-next-line new-cap
        const webhook_router = express.Router();

        webhook_router.post("/topgg", VotesManager.webhookListener);

        this.app.use("/webhook", webhook_router);

        this.app.get("/", (req, res) => res.status(200).send("hi there"));
    }

    public listen(): void {
        if (server) return;
        server = this.app.listen(WEBHOOK_PORT);
    }
}

export default new WebhookManager();
