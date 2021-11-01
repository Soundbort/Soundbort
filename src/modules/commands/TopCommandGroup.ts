import Discord from "discord.js";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
import { CommandTarget, GuildCreateEventHandler, MiddlewareFunc } from "./types";

export interface TopCommandGroupOptions {
    name: string;
    description: string;
    commands: (Command | CommandGroup)[];
    target?: CommandTarget;
    middleware?: MiddlewareFunc;
    onGuildCreate?: GuildCreateEventHandler;
}

export class TopCommandGroup extends CommandGroup {
    app_command: Discord.ApplicationCommand | null = null;
    target: CommandTarget;

    onGuildCreate?: GuildCreateEventHandler;

    private _json?: Discord.ApplicationCommandData;

    constructor({ name, description, commands, target = { global: false, guildHidden: false }, middleware, onGuildCreate }: TopCommandGroupOptions) {
        super({ name, description, commands, middleware });

        this.target = target;
        this.onGuildCreate = onGuildCreate;
    }

    protected _getSubcommand(interaction: Discord.CommandInteraction | Discord.AutocompleteInteraction): Command | undefined {
        const command_name = interaction.options.getSubcommandGroup(false) || interaction.options.getSubcommand(true);
        return this.commands.get(command_name);
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (this.middleware && !await this.middleware(interaction)) return;

        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.run(interaction);
    }

    toJSON(): Discord.ApplicationCommandData {
        // save calculations when getting json for thousands of guilds at once
        if (this._json) return this._json;

        return this._json = {
            name: this.name,
            description: this.description,
            options: [...this.commands.values()].map(subcommand => subcommand.toJSON()),
            defaultPermission: !this.target.guildHidden,
        };
    }
}
