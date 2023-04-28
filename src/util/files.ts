import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import disk from "diskusage";

import Logger from "../log.js";

const log = Logger.child({ label: "util => files" });

export async function isEnoughDiskSpace(): Promise<boolean> {
    const info = await disk.check("/");
    const yes = info.available > 1000 * 1000 * 1000;
    if (!yes) log.warn("RUNNING OUT OF DISK SPACE");
    return yes;
}

export async function downloadFile(url: string, out_file: string | URL): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Resource not accessible");
    if (!res.body) throw new Error("fetch.Response.body is undefined");

    await pipeline(
        Readable.fromWeb(res.body as ReadableStream<Uint8Array>), // ? unfortunately the ReadableStream implementations don't match
        fs.createWriteStream(out_file),
    );
}
