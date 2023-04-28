import * as Discord from "discord.js";

export interface CmdInstallerArgs {
    client: Discord.Client<true>;
    registry: import("../core/InteractionRegistry.js").default;
    admin: import("../core/permissions/AdminPermissions.js").default;
}

export type CmdInstallerFileFunc = (opts: CmdInstallerArgs) => (Promise<void> | void);
export interface CmdInstallerFile {
    install?: CmdInstallerFileFunc;
}
