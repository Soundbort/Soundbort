import Discord from "discord.js";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
import { CommandTarget, GuildCreateEventHandler } from "./types";

export interface TopCommandGroupOptions {
    name: string;
    description: string;
    commands: (Command | CommandGroup)[];
    target?: CommandTarget;
    onGuildCreate?: GuildCreateEventHandler;
}
export class TopCommandGroup {
    app_command: Discord.ApplicationCommand | null = null;
    name: string;
    description: string;
    commands: Map<string, Command | CommandGroup> = new Map();
    target: CommandTarget;
    onGuildCreate?: GuildCreateEventHandler;

    constructor({ name, description, commands, target = { global: false, guildHidden: false }, onGuildCreate }: TopCommandGroupOptions) {
        this.name = name;
        this.description = description;
        this.target = target;
        this.onGuildCreate = onGuildCreate;

        for (const command of commands) this.addCommand(command);
    }

    addCommand(command: Command | CommandGroup): this {
        if (this.commands.has(command.name)) throw new Error("Command name already exists");

        this.commands.set(command.name, command);
        return this;
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        const command_name = interaction.options.getSubcommandGroup(false) || interaction.options.getSubcommand(true);
        const command = this.commands.get(command_name);
        if (!command) return;

        return await command.run(interaction);
    }

    toJSON(): Discord.ApplicationCommandData {
        return {
            name: this.name,
            description: this.description,
            options: [...this.commands.values()].map(subcommand => subcommand.toJSON()),
            defaultPermission: !this.target.guildHidden,
        };
    }
}
