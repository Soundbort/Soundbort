import Discord from "discord.js";
import { Command, CommandOptions } from "./Command";
import { GuildCreateEvent, CommandTarget } from "./types";

export interface TopCommandOptions extends CommandOptions {
    permissions?: Discord.ApplicationCommandPermissions[]
    target?: CommandTarget;
    onGuildCreate?: GuildCreateEvent;
}

export class TopCommand extends Command {
    permissions: Discord.ApplicationCommandPermissionData[];
    target: CommandTarget;

    onGuildCreate?: GuildCreateEvent;

    constructor({ name, description, options = [], permissions = [], target = { global: false, guildHidden: false }, func, onGuildCreate }: TopCommandOptions) {
        super({ name, description, options, func });

        this.permissions = permissions;
        this.target = target;
        this.onGuildCreate = onGuildCreate;
    }

    addPermissions(...perms: Discord.ApplicationCommandPermissions[]): this {
        this.permissions.push(...perms);
        return this;
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
