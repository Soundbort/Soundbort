import temp from "temp";
import Discord from "discord.js";
import * as database from "../modules/database";
import Logger from "../log";

temp.track();

const log = Logger.child({ label: "Util => Exit" });

export function exit(client: Discord.Client, code = 0): void {
    log.info("Gracefully exiting...");

    log.debug("Deleting temporary files...");
    temp.cleanupSync();
    log.debug("Temporary files deleted.");

    log.debug("Destroying client...");
    client.destroy();
    log.debug("Client destroyed.");

    log.debug("Closing MongoDb connection...");
    database.close()
        .finally(() => {
            log.debug("MongoDb connection closed.");

            process.exit(code);
        });
}
