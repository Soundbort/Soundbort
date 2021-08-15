export const COLOR = {
    // TEXT: 0x2f3136,
    // WHITE: 0xffffff,
    CHART_FG: 0xffffff,
    CHART_BG: 0x2f3136,

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
    DELETE_ABORT = "6",
    DELETE_USER = "5",
    DELETE_SERVER = "8",
}

export const BUTTON_TYPES_NAMES = {
    [BUTTON_TYPES.PLAY_CUSTOM]: "play",
    [BUTTON_TYPES.PLAY_STANDA]: "play",
    [BUTTON_TYPES.IMPORT_USER]: "import to user",
    [BUTTON_TYPES.IMPORT_SERVER]: "import to server",
    [BUTTON_TYPES.DELETE_ASK]: "delete dialog",
    [BUTTON_TYPES.DELETE_ABORT]: "delete abort",
    [BUTTON_TYPES.DELETE_USER]: "delete from user",
    [BUTTON_TYPES.DELETE_SERVER]: "delete from server",
};
