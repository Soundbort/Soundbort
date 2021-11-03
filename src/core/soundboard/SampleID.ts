import { customAlphabet } from "nanoid";

const PREFIX = "s";
const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz";
const LENGTH = 6;
const REGEX = new RegExp(`^${PREFIX}[${CHARSET}]{${LENGTH}}$`);
const nanoid = customAlphabet(CHARSET, LENGTH);

/**
 * Checks if a string is a valid SampleID string
 * @param {string} id
 * @returns {boolean}
 */
function isId(id: string): boolean {
    return REGEX.test(id);
}

function generate(): string {
    return PREFIX + nanoid();
}

export default {
    PREFIX,
    CHARSET,
    LENGTH,
    REGEX,
    nanoid,
    isId,
    generate,
};
