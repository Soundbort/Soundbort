import Discord from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import { ApplicationCommandOptionChoice } from "./options/createChoice";

export interface BaseCommandOptionData {
    name: string;
    description: string;
    required?: boolean;
}

export interface CommandOptionChoiceData<T extends string | number = string | number> {
    choices?: ApplicationCommandOptionChoice<T>[];
}

export interface CommandOptionChannelData {
    channelTypes?: Discord.ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[];
}

export abstract class BaseCommandOption {
    readonly data: Discord.ApplicationCommandOptionData;

    constructor(type: Discord.ApplicationCommandOptionType, data: BaseCommandOptionData & CommandOptionChoiceData & CommandOptionChannelData) {
        this.data = {
            type: type,
            name: data.name,
            description: data.description,
            required: data.required ?? false,
            choices: data.choices,
            channelTypes: data.channelTypes,
        };
    }
}

export class CommandStringOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<string>)) {
        super("STRING", data);
    }
}
export class CommandIntegerOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<number>)) {
        super("INTEGER", data);
    }
}
export class CommandNumberOption extends BaseCommandOption {
    constructor(data: BaseCommandOptionData & (CommandOptionChoiceData<number>)) {
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
