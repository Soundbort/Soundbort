import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import fetch from "node-fetch";
import disk from "diskusage";

import Logger from "../log";

const log = Logger.child({ label: "util => files" });

export function walk(dir: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        let results: string[] = [];

        fs.readdir(dir, (err, files) => {
            if (err) return reject(err);
            let pending = files.length;
            if (!pending) return resolve(results);

            for (let file of files) {
                file = path.join(dir, file);

                fs.stat(file, (err, stat) => {
                    if (err) return reject(err);
                    if (stat && stat.isDirectory()) {
                        walk(file)
                            .then(files => {
                                results = [...results, ...files];
                                if (!--pending) resolve(results);
                            })
                            .catch(error => reject(error));
                    } else {
                        results.push(file);
                        if (!--pending) resolve(results);
                    }
                });
            }
        });
    });
}

export async function isEnoughDiskSpace(): Promise<boolean> {
    const info = await disk.check("/");
    const yes = info.available > 1000 * 1000 * 1000;
    if (!yes) log.warn("RUNNING OUT OF DISK SPACE");
    return yes;
}

export async function downloadFile(url: string, out_file: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Resource not accessible");
    if (!res.body) throw new Error("node-fetch.Response.body is undefined");

    await pipeline(
        res.body,
        fs.createWriteStream(out_file),
    );
}
