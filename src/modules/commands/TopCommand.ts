import Discord from "discord.js";

import { Command, CommandOptions } from "./Command.js";
import { CommandTarget, GuildCreateEventHandler } from "./types/index.js";

export interface TopCommandOptions extends CommandOptions {
    target?: CommandTarget;
    onGuildCreate?: GuildCreateEventHandler;
}

export class TopCommand extends Command {
    app_command: Discord.ApplicationCommand | null = null;
    target: CommandTarget;

    onGuildCreate?: GuildCreateEventHandler;

    private _json?: Discord.ApplicationCommandData;

    constructor({ name, description, options = [], target = { global: false, guildHidden: false }, func, onGuildCreate }: TopCommandOptions) {
        super({ name, description, options, func });

        this.target = target;
        this.onGuildCreate = onGuildCreate;
    }

    toJSON(): Discord.ApplicationCommandData {
        // save calculations when getting json for thousands of guilds at once
        if (this._json) return this._json;

        return this._json = {
            type: "CHAT_INPUT",
            name: this.name,
            description: this.description,
            options: [...this.options.values()].map(o => o.data),
            defaultPermission: !this.target.guildHidden,
        };
    }
}
