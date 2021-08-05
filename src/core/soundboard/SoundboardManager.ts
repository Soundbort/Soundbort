import Discord from "discord.js";

import { remove } from "./methods/delete";
import { list } from "./methods/list";
import { upload } from "./methods/upload";

class SoundboardManager {
    upload(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<any> {
        return upload(interaction, name, scope);
    }

    list(interaction: Discord.CommandInteraction, scope: "user" | "server" | "all"): Promise<void> {
        return list(interaction, scope);
    }

    remove(interaction: Discord.CommandInteraction, name: string, scope: "user" | "server" | "standard"): Promise<void> {
        return remove(interaction, name, scope);
    }
}

export default new SoundboardManager();
