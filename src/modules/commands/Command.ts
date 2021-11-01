import Discord from "discord.js";
import { BaseCommandOption } from "./CommandOption";
import { SimpleFunc } from "./types";

export interface CommandOptions {
    name: string,
    description: string,
    options?: BaseCommandOption[],
    func?: SimpleFunc,
}

export class Command {
    name: string;
    description: string;
    options: Map<string, BaseCommandOption> = new Map();

    func: SimpleFunc | undefined;

    constructor({ name, description, options = [], func }: CommandOptions) {
        this.name = name;
        this.description = description;
        this.func = func;

        for (const option of options) {
            if (this.options.has(option.data.name)) throw new Error("Option name already exists");

            this.options.set(option.data.name, option);
        }
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (!this.func) return;

        const result = await this.func(interaction);
        if (!result || interaction.replied) return;

        if (interaction.deferred) await interaction.editReply(result);
        else await interaction.reply(result);
    }

    toJSON(): any { // need return type any for TopCommand to work
        return {
            type: "SUB_COMMAND",
            name: this.name,
            description: this.description,
            options: [...this.options.values()].map(o => o.data),
        };
    }
}
