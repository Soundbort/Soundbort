import Discord from "discord.js";
import { Command } from "./Command";

export interface CommandGroupOptions {
    name: string;
    description: string;
    commands: Command[];
}

export class CommandGroup extends Command {
    type: Discord.ApplicationCommandOptionType = "SUB_COMMAND_GROUP";
    commands: Map<string, Command> = new Map();

    constructor({ name, description, commands }: CommandGroupOptions) {
        super({ name, description });

        for (const command of commands) {
            if (this.commands.has(command.name)) throw new Error("Command name already exists");

            this.commands.set(command.name, command);
        }
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        const command_name = interaction.options.getSubcommand(true);
        const command = this.commands.get(command_name);
        if (!command) return;

        return await command.run(interaction);
    }

    toJSON(): any { // need return type any for TopCommandGroup to work
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: [...this.commands.values()].map(subcommand => subcommand.toJSON()),
        };
    }
}
