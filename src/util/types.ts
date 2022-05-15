import * as Discord from "discord.js";

export interface CmdInstallerArgs {
    client: Discord.Client<true>;
}

export type CmdInstallerFileFunc = (opts: CmdInstallerArgs) => (Promise<void> | void);
export interface CmdInstallerFile {
    install?: CmdInstallerFileFunc;
}
