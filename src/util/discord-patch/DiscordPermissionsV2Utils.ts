import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

import { RESTPostAPIChatInputApplicationCommand } from "../../modules/commands/SlashCommand";

export default class DiscordPermissions2VUtils {
    /**
     * A WeakMap of instances, so a new instance doesn't have
     * to be created on every call.
     */
    static instances = new WeakMap<Discord.Client, DiscordPermissions2VUtils>();

    public client: Discord.Client<true>;
    public rest: REST = new REST({ version: "10" });

    constructor(client: Discord.Client<true>) {
        this.client = client;
        this.rest.setToken(client.token);
    }

    public async setApplicationCommands(commands_data: RESTPostAPIChatInputApplicationCommand[]) {
        return await this.rest.put(
            Routes.applicationCommands(this.client.application.id),
            { body: commands_data },
        );
    }

    public async setApplicationGuildCommands(guild_id: Discord.Snowflake, commands_data: RESTPostAPIChatInputApplicationCommand[]) {
        return await this.rest.put(
            Routes.applicationGuildCommands(this.client.application.id, guild_id),
            { body: commands_data },
        );
    }

    static client(client: Discord.Client<true>) {
        let instance = this.instances.get(client);
        if (instance) {
            return instance;
        }

        this.instances.set(client, instance = new DiscordPermissions2VUtils(client));

        return instance;
    }
}
