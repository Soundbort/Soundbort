import * as Discord from "discord.js";
import { ENVIRONMENT, EnvironmentStages, OWNER_GUILD_IDS } from "../../../config";

export type SlashCommandPermissionsOptions = {
    /** Whether the command should be deployed as a global command */
    is_global: true;
    /** Indicates whether the command is available in DMs with the app,
     *  only for globally-scoped commands.
     *  @default true */
    dm_permission?: boolean;
    /** 0n if no one is allowed to use the command */
    default_member_permissions?: Discord.Permissions;
} | {
    /** Whether the command should be deployed as a global command */
    is_global: false;
    /** Array is guild ids the command is exclusively available in */
    allowed_guild_ids?: Discord.Snowflake[];
    /** 0n if no one is allowed to use the command */
    default_member_permissions?: Discord.Permissions;
};

const IS_DEV = ENVIRONMENT === EnvironmentStages.DEVEL;

export class SlashCommandPermissions {
    public readonly is_global: boolean;
    public readonly allowed_guild_ids: Discord.Snowflake[];
    public readonly data: Readonly<{
        default_member_permissions?: string;
        dm_permission?: boolean;
    }>;

    constructor(opts: SlashCommandPermissionsOptions) {
        this.is_global = opts.is_global;

        const default_member_permissions = opts.default_member_permissions
            ? opts.default_member_permissions.bitfield.toString()
            : undefined;

        if (opts.is_global) {
            this.allowed_guild_ids = [];
            this.data = {
                default_member_permissions,
                dm_permission: opts.dm_permission ?? true,
            };
        } else {
            this.allowed_guild_ids = opts.allowed_guild_ids ?? [];
            this.data = {
                default_member_permissions,
            };
        }
    }

    public testGuild(guild_id: Discord.Snowflake) {
        return this.allowed_guild_ids.length === 0 || this.allowed_guild_ids.includes(guild_id);
    }

    // USEFUL DEFAULTS

    static GLOBAL = new SlashCommandPermissions({
        is_global: !IS_DEV,
    });

    static OWNER = new SlashCommandPermissions({
        is_global: false,
        default_member_permissions: new Discord.Permissions(0n),
        // this way, owner commands are only available in specific guilds
        allowed_guild_ids: OWNER_GUILD_IDS,
    });

    static ADMIN = new SlashCommandPermissions({
        is_global: !IS_DEV,
        dm_permission: false,
        default_member_permissions: new Discord.Permissions(Discord.Permissions.FLAGS.ADMINISTRATOR),
    });

    static EVERYONE = new SlashCommandPermissions({
        is_global: !IS_DEV,
        dm_permission: false,
    });
}
