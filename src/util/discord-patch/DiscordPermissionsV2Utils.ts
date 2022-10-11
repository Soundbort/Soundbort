/**
 * This here file houses a couple of utility methods
 * and methods to interact with the REST API until
 * this functionality is added or fixed in discord.js
 */

import { Merge } from "type-fest";
import * as Discord from "discord.js";

import Logger from "../../log";
import { RESTPostAPIChatInputApplicationCommand } from "../../modules/commands/SlashCommand";

export type PatchedAPIApplicationCommand = Discord.APIApplicationCommand & {
    default_member_permissions: string | null;
    dm_permission?: boolean;
};

export type PatchedAPIApplicationCommandPermission = Merge<Discord.APIApplicationCommandPermission, {
    type: Discord.ApplicationCommandPermissionType | 3;
}>;

export interface TestCommandPermissionsReturn {
    channel: boolean;
    user: boolean;
    access: boolean;
}

const log = Logger.child({ label: "DiscordPermissionsV2Utils" });

export default class DiscordPermissionsV2Utils {
    /**
     * A WeakMap of instances, so a new instance doesn't have
     * to be created on every call.
     */
    static instances = new WeakMap<Discord.Client, DiscordPermissionsV2Utils>();

    public client: Discord.Client<true>;
    public rest: Discord.REST = new Discord.REST({ version: "10" });

    constructor(client: Discord.Client<true>) {
        this.client = client;
        this.rest.setToken(client.token);
    }

    public async setApplicationCommands(commands_data: RESTPostAPIChatInputApplicationCommand[]) {
        return await this.rest.put(
            Discord.Routes.applicationCommands(this.client.application.id),
            { body: commands_data },
        ) as Promise<PatchedAPIApplicationCommand[]>;
    }

    public async getApplicationCommands() {
        return this.rest.get(
            Discord.Routes.applicationCommands(this.client.application.id),
        ) as Promise<PatchedAPIApplicationCommand[]>;
    }

    public async setApplicationGuildCommands(guild_id: Discord.Snowflake, commands_data: RESTPostAPIChatInputApplicationCommand[]) {
        return await this.rest.put(
            Discord.Routes.applicationGuildCommands(this.client.application.id, guild_id),
            { body: commands_data },
        ) as Promise<PatchedAPIApplicationCommand[]>;
    }

    public async getApplicationGuildCommands(guild_id: Discord.Snowflake) {
        return this.rest.get(
            Discord.Routes.applicationGuildCommands(this.client.application.id, guild_id),
        ) as Promise<PatchedAPIApplicationCommand[]>;
    }

    public async fetchCommandByName(guild_id: Discord.Snowflake, command_name: string) {
        const [global_commands, guild_commands] = await Promise.all([
            this.getApplicationCommands(),
            this.getApplicationGuildCommands(guild_id),
        ]);

        return [...guild_commands, ...global_commands].find(cmd => cmd.name === command_name);
    }

    public async fetchCommandPermissionsById(command: PatchedAPIApplicationCommand, guild_id: Discord.Snowflake): Promise<Discord.APIGuildApplicationCommandPermissions | undefined> {
        const command_permissions = await this.rest.get(
            Discord.Routes.guildApplicationCommandsPermissions(this.client.application.id, guild_id),
        ) as Discord.APIGuildApplicationCommandPermissions[];

        // Constants
        // https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-constants

        // If the permissions for commandId do not exist (means they are synched), then take the permissions for
        // the whole application
        // commandId permissions override the application permissions. They (last time i checked) contain all
        // permissions a user needs
        const permissions = command_permissions.find(perm => perm.id === command.id)
            ?? command_permissions.find(perm => perm.id === command.application_id);

        return permissions;
    }

    #testChannelPermissions(channel_perms: Map<Discord.Snowflake, boolean>, guild_id: Discord.Snowflake, channel_id: Discord.Snowflake) {
        // check most specific first -> individual channel
        const channel_perm = channel_perms.get(channel_id);
        if (typeof channel_perm === "boolean") {
            return channel_perm;
        }

        // catch all (all-channels allowed / disallowed)
        const all_channels_id = (BigInt(guild_id) - 1n).toString();
        const all_channels_perm = channel_perms.get(all_channels_id);

        return all_channels_perm ?? true;
    }

    #testUserPermissions(user_perms: Map<Discord.Snowflake, boolean>, allowed_roles: Discord.Snowflake[], disallowed_roles: Discord.Snowflake[], everyone: boolean, member: Discord.GuildMember): boolean {
        // check most specific to least specific

        // if there is an exact match, the member is specifically allowed or denied
        const user_perm = user_perms.get(member.id);
        if (typeof user_perm === "boolean") {
            return user_perm;
        }
        log.debug("No specific user match.", { member_id: member.id });

        // Roles
        // If the user has at least one of the allowed roles, access is granted
        if (allowed_roles.some(allowed_role => member.roles.cache.has(allowed_role))) {
            return true;
        }
        log.debug("Has no explicitly allowed role.", { member_id: member.id });

        // If the user has no allowed roles, and has one or more of the disallowed roles, access is denied
        if (disallowed_roles.some(disallowed_role => member.roles.cache.has(disallowed_role))) {
            return false;
        }
        log.debug("Has no explicitly denied role.", { member_id: member.id });

        // If no roles match, fall back to @everyone allowed or disallowed
        return everyone;
    }

    public testCommandPermissions(command: PatchedAPIApplicationCommand, permissions: Discord.APIGuildApplicationCommandPermissions | undefined, channel_id: Discord.Snowflake | null, member: Discord.GuildMember): TestCommandPermissionsReturn {
        log.debug("Testing permissions", {
            command_id: command.id,
            guild_id: member.guild.id,
            channel_id,
            member_id: member.id,
        });

        // If user has admin permissions, always allow (reverse engineered)
        if (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
            log.debug("Member has Administrator permissions.", { member_id: member.id });
            return {
                access: true,
                channel: true,
                user: true,
            };
        }

        // if custom permissions are set, they always override the default_member_permissions
        if (permissions) {
            log.debug("Command has custom permissions", permissions);

            const channel_perms = new Map<Discord.Snowflake, boolean>();

            const user_perms = new Map<Discord.Snowflake, boolean>();

            const allowed_roles: Discord.Snowflake[] = [];
            const disallowed_roles: Discord.Snowflake[] = [];
            let everyone_role: boolean = true;

            // sort permissions into their respective types.
            // permissions are not evaluated in the order they come
            // in APIGuildApplicationCommandPermissions.permissions.
            // Instead first channels are evaluated, then users, then roles (reverse engineered)
            for (const perm of permissions.permissions) {
                switch (perm.type as PatchedAPIApplicationCommandPermission["type"]) {
                    case 1: // Role
                        if (perm.id === permissions.guild_id) {
                            everyone_role = perm.permission;
                        } else if (perm.permission) {
                            allowed_roles.push(perm.id);
                        } else {
                            disallowed_roles.push(perm.id);
                        }
                        break;
                    case 2: // User
                        user_perms.set(perm.id, perm.permission);
                        break;
                    case 3: // Channel
                        channel_perms.set(perm.id, perm.permission);
                        break;
                }
            }

            const channel = channel_id ? this.#testChannelPermissions(channel_perms, permissions.guild_id, channel_id) : false;
            const user = this.#testUserPermissions(user_perms, allowed_roles, disallowed_roles, everyone_role, member);

            return {
                access: channel && user,
                channel,
                user,
            };
        }

        // if the command has default_member_permissions, evaluate them as a last
        // resort. Otherwise, if no restrictions are set, always allow the command
        if (command.default_member_permissions) {
            log.debug("Command has default_member_permissions");

            const perms = new Discord.Permissions(BigInt(command.default_member_permissions));
            const access = member.permissions.has(perms);

            return {
                access: access,
                channel: true,
                user: access,
            };
        }

        return {
            access: true,
            channel: true,
            user: true,
        };
    }

    async canUseCommand(api_command: PatchedAPIApplicationCommand, guild: Discord.Guild, channel_id: Discord.Snowflake | null, member_id: Discord.Snowflake): Promise<TestCommandPermissionsReturn> {
        const member = await guild.members.fetch({ user: member_id, force: true });
        const cmd_permissions = await this.fetchCommandPermissionsById(api_command, guild.id);
        const permissions = this.testCommandPermissions(api_command, cmd_permissions, channel_id, member);

        return permissions;
    }

    static client(client: Discord.Client<true>) {
        let instance = this.instances.get(client);
        if (instance) {
            return instance;
        }

        this.instances.set(client, instance = new DiscordPermissionsV2Utils(client));

        return instance;
    }
}
