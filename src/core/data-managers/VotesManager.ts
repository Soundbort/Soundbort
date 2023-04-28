import { TypedEmitter } from "tiny-typed-emitter";
import { Webhook, WebhookPayload } from "@top-gg/sdk";

import Logger from "../../log.js";
import { TOP_GG_WEBHOOK_TOKEN } from "../../config.js";

import * as models from "../../modules/database/models.js";
import { VotesSchema } from "../../modules/database/schemas/VotesSchema.js";

const log = Logger.child({ label: "Core => VotesManager" });

interface WebhookManagerEvents {
    vote(vote: VotesSchema): void;
}

class VotesManager extends TypedEmitter<WebhookManagerEvents> {
    private webhook = new Webhook(TOP_GG_WEBHOOK_TOKEN, {
        error(error) {
            log.error("Top.gg webhook error", error);
        },
    });

    get webhookListener() {
        return this.webhook.listener(vote => this.processVote(vote));
    }

    async processVote(vote: WebhookPayload) {
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
    }
}

export default new VotesManager();
