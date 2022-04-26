import Logger from "../../log";
import { exit } from "../../util/exit";

import { SlashSubCommand } from "../../modules/commands/SlashSubCommand";
import { createBooleanOption } from "../../modules/commands/options/boolean";
import { replyEmbed } from "../../util/builders/embed";

import AudioManager from "../../core/audio/AudioManager";

const log = Logger.child({ label: "Reboot" });

let graceful_shutdown = false;
function shutdown(force: boolean) {
    if (force) {
        exit(0);
        return;
    }

    if (graceful_shutdown) {
        return replyEmbed("Graceful shutdown is already queued.");
    }
    graceful_shutdown = true;

    // wait for all voice connetions to be destroyed naturally
    AudioManager.awaitDestroyable()
        .then(() => {
            log.debug("In no more voice connections. Shutting down.");
            exit(0);
        })
        .catch(error => log.error("Error in AudioManager#awaitDestroyable", error));

    log.info("Queued shutdown");

    return replyEmbed("Gracefully shutting down. Waiting for all voice connections to be destroyed.");
}

export default new SlashSubCommand({
    name: "reboot",
    description: "Reboot the bot",
    options: [
        createBooleanOption({
            name: "force",
            description: "Disconnect everything and restart immediately. If false, wait for all voice connections to end.",
        }),
    ],
    func(interaction) {
        const force = interaction.options.getBoolean("force") ?? false;

        return shutdown(force);
    },
});
