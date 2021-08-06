import Discord from "discord.js";
import { Command, CommandOptions } from "./Command";
import { GuildCreateEventHandler, CommandTarget } from "./types";

export interface TopCommandOptions extends CommandOptions {
    target?: CommandTarget;
    onGuildCreate?: GuildCreateEventHandler;
}

export class TopCommand extends Command {
    app_command: Discord.ApplicationCommand | null = null;
    target: CommandTarget;

    onGuildCreate?: GuildCreateEventHandler;

    constructor({ name, description, options = [], target = { global: false, guildHidden: false }, func, onGuildCreate }: TopCommandOptions) {
        super({ name, description, options, func });

        this.target = target;
        this.onGuildCreate = onGuildCreate;
    }

    toJSON(): Discord.ApplicationCommandData {
        return {
            name: this.name,
            description: this.description,
            options: [...this.options.values()],
            defaultPermission: !this.target.guildHidden,
        };
    }
}
