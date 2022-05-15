import * as Discord from "discord.js";
import { APIAttachment, APIChatInputApplicationCommandInteractionData } from "discord-api-types/v10";

import "./InteractionCreateAction.patch.js";
declare module "discord.js" {
    interface CommandInteraction {
        readonly _data: APIChatInputApplicationCommandInteractionData & {
            attachments?: Record<Discord.Snowflake, APIAttachment>;
        };
    }
}
