import Discord from "discord.js";

export interface KeyValue<V> {
    [code: string]: V | undefined;
}

export interface CmdInstallerArgs {
    client: Discord.Client<true>;
    stats_collector: import("../core/StatsCollectorManager").StatsCollectorManager;
}

export type CmdInstallerFileFunc = (opts: CmdInstallerArgs) => (Promise<void> | void);
export type CmdInstallerFile =
    & { install?: CmdInstallerFileFunc; };
