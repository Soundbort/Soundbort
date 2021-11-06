import Discord from "discord.js";

import { Command } from "./Command.js";

export type MiddlewareFunc = (interaction: Discord.CommandInteraction) => Discord.Awaitable<boolean>;

export interface CommandGroupOptions {
    name: string;
    description: string;
    commands: Command[];
    middleware?: MiddlewareFunc;
}

export class CommandGroup extends Command {
    commands: Map<string, Command> = new Map();

    middleware?: MiddlewareFunc;

    constructor({ name, description, commands, middleware }: CommandGroupOptions) {
        super({ name, description });

        for (const command of commands) {
            if (this.commands.has(command.name)) throw new Error("Command name already exists");

            this.commands.set(command.name, command);
        }

        this.middleware = middleware;
    }

    protected _getSubcommand(interaction: Discord.CommandInteraction | Discord.AutocompleteInteraction): Command | undefined {
        const command_name = interaction.options.getSubcommand(true);
        return this.commands.get(command_name);
    }

    async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.autocomplete(interaction);
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (this.middleware && !await this.middleware(interaction)) return;

        const command = this._getSubcommand(interaction);
        if (!command) return;

        await command.run(interaction);
    }

    toJSON(): any { // need return type any for TopCommandGroup to work
        return {
            type: "SUB_COMMAND_GROUP",
            name: this.name,
            description: this.description,
            options: [...this.commands.values()].map(subcommand => subcommand.toJSON()),
        };
    }
}
