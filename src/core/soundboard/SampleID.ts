import { customAlphabet } from "nanoid";

export default class SampleID {
    /**
     * Checks if a string is a valid SampleID string
     * @param {string} id
     * @returns {boolean}
     */
    static isId(id: string): boolean {
        return SampleID.REGEX.test(id);
    }

    static generate(): string {
        return SampleID.PREFIX + SampleID.nanoid();
    }

    static PREFIX = "s";
    static CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz";
    static LENGTH = 6;
    static REGEX = new RegExp(`^${SampleID.PREFIX}[${SampleID.CHARSET}]{${SampleID.LENGTH}}$`);
    static nanoid = customAlphabet(SampleID.CHARSET, SampleID.LENGTH);
}
