export const COLOR = {
    EMBED_BG: 0x2f3136,

    PRIMARY: 0x6378CA,
    INFO: 0xADBCE6,
    SUCCESS: 0x62D945,
    WARNING: 0xe6a23c,
    ERROR: 0xd8315b,
};

export const EMOJI = {
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "❕",
};

// Important: Don't change these enum values! They are important
//            to keep old buttons working and not doing the completely
//            wrong thing

export enum BUTTON_TYPES {
    PLAY_CUSTOM = "0",
    PLAY_STANDA = "1",

    IMPORT_USER = "2",
    IMPORT_SERVER = "3",

    DELETE_ASK = "4",
    DELETE = "5",
    DELETE_ABORT = "6",
}
