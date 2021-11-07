import express from "express";
import http from "node:http";
import { promisify } from "node:util";

import Logger from "../log.js";
import { WEBHOOK_PORT } from "../config.js";
import { onExit } from "../util/exit.js";
import VotesManager from "./data-managers/VotesManager.js";

const log = Logger.child({ label: "Core => WebhookManager" });

class WebhookListener {
    private server: http.Server | undefined;

    private app: express.Express = express();

    constructor() {
        onExit(this.close);

        this.app.use("/webhook", this.setupWebhookRouter());

        this.app.get("/", (req, res) => res.status(200).send("hi there"));
    }

    private setupWebhookRouter() {
        // eslint-disable-next-line new-cap
        const webhook_router = express.Router();

        webhook_router.post("/topgg", VotesManager.webhookListener);

        return webhook_router;
    }

    public async close(): Promise<void> {
        if (!this.server) return;

        log.debug("Closing webhook server...");
        await promisify(this.server.close)();
    }

    public listen(): void {
        if (this.server) return;
        this.server = this.app.listen(WEBHOOK_PORT);
    }
}

export default new WebhookListener();
