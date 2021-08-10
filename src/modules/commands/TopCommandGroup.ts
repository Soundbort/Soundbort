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

export class TopCommandGroup extends CommandGroup {
    app_command: Discord.ApplicationCommand | null = null;
    target: CommandTarget;

    onGuildCreate?: GuildCreateEventHandler;

    constructor({ name, description, commands, target = { global: false, guildHidden: false }, onGuildCreate }: TopCommandGroupOptions) {
        super({ name, description, commands });

        this.target = target;
        this.onGuildCreate = onGuildCreate;
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
