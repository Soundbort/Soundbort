import Discord from "discord.js";

export interface KeyValue<V> {
    [code: string]: V | undefined;
}

export interface CmdInstallerArgs {
    client: Discord.Client<true>;
}

export type CmdInstallerFileFunc = (opts: CmdInstallerArgs) => (Promise<void> | void);
export interface CmdInstallerFile {
    install?: CmdInstallerFileFunc;
}
