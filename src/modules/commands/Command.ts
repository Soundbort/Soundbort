import * as Discord from "discord.js";

import Logger from "../../log";
import nanoTimer from "../../util/timer";
import { BaseCommandOption } from "./CommandOption";

const log = Logger.child({ label: "Command => autocomplete" });

export type SimpleFuncReturn = string | Discord.MessagePayload | Discord.InteractionReplyOptions | undefined | void;

export type SimpleFunc = (interaction: Discord.CommandInteraction) => Discord.Awaitable<SimpleFuncReturn>;

export interface CommandTarget {
    global: boolean;
    guildHidden: boolean;
    guild_ids?: Discord.Snowflake[];
}

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

    async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        const timer = nanoTimer();

        const focused = interaction.options.getFocused(true);
        const option = this.options.get(focused.name);
        if (!option || !option.autocomplete) return;

        let choices: Discord.ApplicationCommandOptionChoice[];
        try {
            choices = await option.autocomplete(focused.value, interaction);
        } catch (error) {
            const exec_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_MS;
            log.debug("%s='%s' for '%s' by %s in %s (%s) finished in %sms", focused.name, focused.value, this.name, interaction.user.id, interaction.channelId, interaction.channel?.type, exec_time.toFixed(3));

            throw error;
        }

        const exec_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_MS;
        log.debug("%s='%s' for '%s' by %s in %s (%s) finished in %sms", focused.name, focused.value, this.name, interaction.user.id, interaction.channelId, interaction.channel?.type, exec_time.toFixed(3));

        await interaction.respond(choices);
    }

    async run(interaction: Discord.CommandInteraction): Promise<void> {
        if (!this.func) return;

        const result = await this.func(interaction);
        if (!result || interaction.replied) return;

        await (interaction.deferred ? interaction.editReply(result) : interaction.reply(result));
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
