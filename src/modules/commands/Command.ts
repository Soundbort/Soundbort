import Discord from "discord.js";
import { SimpleFunc } from "./types";

export interface CommandOptions {
    name: string,
    description: string,
    options?: Discord.ApplicationCommandOptionData[],
    func?: SimpleFunc,
}

export class Command {
    type: Discord.ApplicationCommandOptionType = "SUB_COMMAND";
    name: string;
    description: string;
    options: Map<string, Discord.ApplicationCommandOptionData> = new Map();

    func: SimpleFunc | undefined;

    constructor({ name, description, options = [], func }: CommandOptions) {
        this.name = name;
        this.description = description;
        this.func = func;

        for (const option of options) {
            if (this.options.has(option.name)) throw new Error("Option name already exists");

            this.options.set(option.name, option);
        }
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (!this.func) return;

        const result = await this.func(interaction);
        if (!result || interaction.replied) return;

        await interaction.reply(result);
    }

    toJSON(): any { // need return type any for TopCommand to work
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: [...this.options.values()],
        };
    }
}
