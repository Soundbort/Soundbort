import Discord from "discord.js";
import { Command } from "./Command";

export interface CommandGroupOptions {
    name: string;
    description: string;
    commands: Command[];
}

export class CommandGroup {
    type: Discord.ApplicationCommandOptionType = "SUB_COMMAND_GROUP";
    name: string;
    description: string;
    commands: Map<string, Command> = new Map();

    constructor({ name, description, commands }: CommandGroupOptions) {
        this.name = name;
        this.description = description;

        for (const command of commands) this.addCommand(command);
    }

    addCommand(command: Command): this {
        if (this.commands.has(command.name)) throw new Error("Command name already exists");

        this.commands.set(command.name, command);
        return this;
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        const command_name = interaction.options.getSubcommand(true);
        const command = this.commands.get(command_name);
        if (!command) return;

        return await command.run(interaction);
    }

    toJSON(): Discord.ApplicationCommandOptionData {
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: [...this.commands.values()].map(subcommand => subcommand.toJSON()),
        };
    }
}
