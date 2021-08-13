export interface StatsSchema {
    _id: Date;

    guilds: number;
    voice_connections: number;
    commands: {
        [name: string]: number;
    };
    buttons?: {
        [type: string]: number;
    };
    custom_samples: number;
    played_samples: number;

    ping: number;
    uptime: number;

    cpu_load_avg: [number, number, number]; // 1, 5, 15 minutes
    memory_usage: number;

    database: {
        collections: number;
        documents: number;
        storageSize: number;
        indexSize: number;
    };
}
