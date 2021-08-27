import { Webhook } from "@top-gg/sdk";
import express from "express";
import http from "http";
import { promisify } from "util";

import { TOP_GG_WEBHOOK_TOKEN, WEBHOOK_PORT } from "../../config";
import Logger from "../../log";
import { logErr } from "../../util/util";
import * as models from "../../modules/database/models";
import * as database from "../../modules/database";
import { TypedEventEmitter, GenericListener } from "../../util/emitter";
import { VotesSchema } from "../../modules/database/schemas/VotesSchema";
import { onExit } from "../../util/exit";

const log = Logger.child({ label: "Core => WebhookManager" });

let server: http.Server | undefined;

database.onConnect(async () => {
    await models.votes.createIndex({ ts: 1, userId: 1 }, { unique: true });
});

onExit(async () => {
    if (!server) return;

    log.debug("Closing webhook server...");
    await promisify(server.close)();
});

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type EventMap = {
    vote: GenericListener<[vote: VotesSchema]>;
};

class WebhookManager extends TypedEventEmitter<EventMap> {
    private app: express.Express;

    constructor() {
        super();

        this.app = express();

        const webhook = new Webhook(TOP_GG_WEBHOOK_TOKEN, {
            error(error) {
                log.error({ error: logErr(error) });
            },
        });

        // eslint-disable-next-line new-cap
        const webhook_router = express.Router();

        webhook_router.post("/topgg", webhook.listener(async vote => {
            if (vote.type !== "upvote") {
                log.debug(vote);
                return;
            }

            const query = typeof vote.query === "string"
                ? undefined
                : vote.query;

            const doc: VotesSchema = {
                ts: new Date(),
                fromUserId: vote.user,
                votes: vote.isWeekend ? 2 : 1,
                query: {
                    ref: query?.ref,
                    guildId: query?.guildId,
                    userId: query?.userId,
                },
            };

            // You can also throw an error to the webhook listener callback in order to
            // resend the webhook after a few seconds
            await models.votes.insertOne(doc);

            log.debug(`Vote by ${doc.fromUserId}. votes:${doc.votes}`);

            this.emit("vote", doc);
        }));

        this.app.use("/webhook", webhook_router);

        this.app.get("/", (req, res) => res.status(200).send("hi there"));
    }

    public listen(): void {
        if (server) return;
        server = this.app.listen(WEBHOOK_PORT);
    }
}

export default new WebhookManager();