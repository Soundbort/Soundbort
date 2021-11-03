import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Gets the directory name as a replacement for __dirname
 *
 * Use like:
 * ```
 * getDirname(import.meta.url);
 * ```
 */
export function getDirname(url: string): string {
    return path.dirname(fileURLToPath(url));
}

/**
 * Gets the filename as a replacement for __filename
 *
 * Use like:
 * ```
 * getFilename(import.meta.url);
 * ```
 */
export function getFilename(url: string): string {
    return fileURLToPath(url);
}
