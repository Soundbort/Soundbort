/**
 * This here file houses a couple of utility methods
 * and methods to interact with the REST API until
 * this functionality is added or fixed in discord.js
 */

import * as Discord from "discord.js";

import Logger from "../log";

export interface TestCommandPermissionsReturn {
    channel: boolean;
    user: boolean;
    access: boolean;
}

const log = Logger.child({ label: "util => permissions" });

export async function fetchCommandPermissionsById(command: Discord.ApplicationCommand, guildId: Discord.Snowflake): Promise<Discord.ApplicationCommandPermissions[]> {
    const command_permissions = await command.client.application.commands.permissions.fetch({ guild: guildId });

    // Constants
    // https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-constants

    // If the permissions for commandId do not exist (means they are synched), then take the permissions for
    // the whole application
    // commandId permissions override the application permissions. They (last time i checked) contain all
    // permissions a user needs
    return command_permissions.get(command.id) ?? command_permissions.get(command.applicationId) ?? [];
}

function testChannelPermissions(channel_perms: Map<Discord.Snowflake, boolean>, guild_id: Discord.Snowflake, channel_id: Discord.Snowflake) {
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

function testUserPermissions(user_perms: Map<Discord.Snowflake, boolean>, allowed_roles: Discord.Snowflake[], disallowed_roles: Discord.Snowflake[], everyone: boolean, member: Discord.GuildMember): boolean {
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

export function testCommandPermissions(command: Discord.ApplicationCommand, permissions: Discord.ApplicationCommandPermissions[], channel_id: Discord.Snowflake | null, member: Discord.GuildMember): TestCommandPermissionsReturn {
    log.debug("Testing permissions", {
        command_id: command.id,
        guild_id: member.guild.id,
        channel_id,
        member_id: member.id,
    });

    // If user has admin permissions, always allow (reverse engineered)
    if (member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        log.debug("Member has Administrator permissions.", { member_id: member.id });
        return {
            access: true,
            channel: true,
            user: true,
        };
    }

    // if custom permissions are set, they always override the default_member_permissions
    if (permissions.length > 0) {
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
        for (const perm of permissions) {
            switch (perm.type) {
                case Discord.ApplicationCommandPermissionType.Role:
                    if (perm.id === member.guild.id) {
                        everyone_role = perm.permission;
                    } else if (perm.permission) {
                        allowed_roles.push(perm.id);
                    } else {
                        disallowed_roles.push(perm.id);
                    }
                    break;
                case Discord.ApplicationCommandPermissionType.User:
                    user_perms.set(perm.id, perm.permission);
                    break;
                case Discord.ApplicationCommandPermissionType.Channel:
                    channel_perms.set(perm.id, perm.permission);
                    break;
            }
        }

        const channel = channel_id ? testChannelPermissions(channel_perms, member.guild.id, channel_id) : false;
        const user = testUserPermissions(user_perms, allowed_roles, disallowed_roles, everyone_role, member);

        return {
            access: channel && user,
            channel,
            user,
        };
    }

    // if the command has default_member_permissions, evaluate them as a last
    // resort. Otherwise, if no restrictions are set, always allow the command
    if (command.defaultMemberPermissions) {
        log.debug("Command has default_member_permissions");

        const access = member.permissions.has(command.defaultMemberPermissions);

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

export async function canUseCommand(command: Discord.ApplicationCommand, guild: Discord.Guild, channel_id: Discord.Snowflake | null, member_id: Discord.Snowflake): Promise<TestCommandPermissionsReturn> {
    const member = await guild.members.fetch({ user: member_id, force: true });
    const command_permissions = await fetchCommandPermissionsById(command, guild.id);
    const permissions = testCommandPermissions(command, command_permissions, channel_id, member);

    return permissions;
}
