export enum COLOR {
    // TEXT: 0x2f3136,
    // WHITE: 0xffffff,
    CHART_FG = 0xFF_FF_FF,
    CHART_BG = 0x2F_31_36,

    PRIMARY = 0x63_78_CA,
    INFO = 0xAD_BC_E6,
    SUCCESS = 0x62_D9_45,
    WARNING = 0xE6_A2_3C,
    ERROR = 0xD8_31_5B,
}

export enum EMOJI {
    SUCCESS = "✅",
    ERROR = "❌",
    WARNING = "⚠️",
    INFO = "❕",
}

export enum SAMPLE_TYPES {
    USER = "user",
    SERVER = "server",
    STANDARD = "standard",
}

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
    [BUTTON_TYPES.PLAY_CUSTOM]: "play user/server",
    [BUTTON_TYPES.PLAY_STANDA]: "play standard",
    [BUTTON_TYPES.IMPORT_USER]: "import to user",
    [BUTTON_TYPES.IMPORT_SERVER]: "import to server",
    [BUTTON_TYPES.DELETE_ASK]: "delete dialog",
    [BUTTON_TYPES.DELETE_ABORT]: "delete abort",
    [BUTTON_TYPES.DELETE_USER]: "delete from user",
    [BUTTON_TYPES.DELETE_SERVER]: "delete from server",
};
