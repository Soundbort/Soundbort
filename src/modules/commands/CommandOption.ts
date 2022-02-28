import * as Discord from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";

export interface ApplicationCommandOptionChoice<T extends string | number> extends Discord.ApplicationCommandOptionChoice {
    name: string;
    value: T;
}

export function createChoice<T extends string | number>(name: string, value: T): ApplicationCommandOptionChoice<T> {
    return { name, value };
}

export type CommandOptionAutocompleteFunc<T = any> = (value: T, interaction: Discord.AutocompleteInteraction) => Discord.Awaitable<Discord.ApplicationCommandOptionChoice[]>;

export interface BaseCommandOptionData {
    name: string;
    description: string;
    required?: boolean;
}

export interface CommandOptionChoiceData<T extends string | number = string | number> {
    choices?: ApplicationCommandOptionChoice<T>[];
}

export interface CommandOptionAutocompleteData<T = any> {
    autocomplete?: CommandOptionAutocompleteFunc<T>;
}

export interface CommandOptionChannelData {
    channelTypes?: Discord.ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[];
}

export abstract class BaseCommandOption {
    readonly data: Discord.ApplicationCommandOptionData;

    autocomplete: CommandOptionAutocompleteFunc | undefined;

    constructor(type: Discord.ApplicationCommandOptionType, data: BaseCommandOptionData & CommandOptionChoiceData & CommandOptionAutocompleteData & CommandOptionChannelData) {
        this.data = {
            type: type,
            name: data.name,
            description: data.description,
            required: data.required ?? false,
            choices: data.choices,
            autocomplete: !!data.autocomplete,
            channelTypes: data.channelTypes,
        };

        this.autocomplete = data.autocomplete;
    }
}

export class CommandStringOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<string> | CommandOptionAutocompleteData<string>)) {
        super("STRING", data);
    }
}
export class CommandIntegerOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<number> | CommandOptionAutocompleteData<number>)) {
        super("INTEGER", data);
    }
}
export class CommandNumberOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<number> | CommandOptionAutocompleteData<number>)) {
        super("NUMBER", data);
    }
}

export class CommandBooleanOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData) {
        super("BOOLEAN", data);
    }
}
export class CommandUserOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData) {
        super("USER", data);
    }
}
export class CommandChannelOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & CommandOptionChannelData) {
        super("CHANNEL", data);
    }
}
export class CommandRoleOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData) {
        super("ROLE", data);
    }
}
export class CommandMentionableOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData) {
        super("MENTIONABLE", data);
    }
}
