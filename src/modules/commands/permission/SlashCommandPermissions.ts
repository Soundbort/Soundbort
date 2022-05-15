import * as Discord from "discord.js";

export interface SlashCommandPermissionsOptions {
    /** Indicates whether the command is available in DMs with the app,
     *  only for globally-scoped commands.
     *  @default true */
    dm_permission?: boolean;
    /** 0n if no one is allowed to use the command */
    default_member_permissions?: Discord.Permissions;
}

export class SlashCommandPermissions {
    public readonly default_member_permissions?: string;
    public readonly dm_permission?: boolean;

    constructor(opts: SlashCommandPermissionsOptions) {
        this.default_member_permissions = opts.default_member_permissions?.bitfield.toString();
        this.dm_permission = opts.dm_permission ?? true;
    }

    // USEFUL DEFAULTS

    static GLOBAL = new SlashCommandPermissions({
        dm_permission: true,
    });

    static HIDDEN = new SlashCommandPermissions({
        dm_permission: false,
        default_member_permissions: new Discord.Permissions(0n),
    });

    static ADMIN = new SlashCommandPermissions({
        dm_permission: false,
        default_member_permissions: new Discord.Permissions(Discord.Permissions.FLAGS.ADMINISTRATOR),
    });

    static EVERYONE = new SlashCommandPermissions({
        dm_permission: false,
    });
}
