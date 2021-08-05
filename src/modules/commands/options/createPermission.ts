import Discord from "discord.js";

function createPermission(
    type: Discord.ApplicationCommandPermissionType,
    id: Discord.Snowflake,
    permission: boolean,
): Discord.ApplicationCommandPermissions {
    return {
        type,
        id,
        permission,
    };
}

export function createUserPermission(id: Discord.Snowflake, permission: boolean): Discord.ApplicationCommandPermissions {
    return createPermission("USER", id, permission);
}
export function createRolePermission(id: Discord.Snowflake, permission: boolean): Discord.ApplicationCommandPermissions {
    return createPermission("ROLE", id, permission);
}
