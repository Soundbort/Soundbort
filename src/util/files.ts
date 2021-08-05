import fetch from "node-fetch";
import fs from "fs";
import path from "path";
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
                file = path.resolve(dir, file);

                fs.stat(file, (err, stat) => {
                    if (err) return reject(err);
                    if (stat && stat.isDirectory()) {
                        walk(file)
                            .then(files => {
                                results = results.concat(files);
                                if (!--pending) resolve(results);
                            })
                            .catch(err => reject(err));
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

    const out_stream = fs.createWriteStream(out_file);

    await new Promise<void>((resolve, reject) => {
        res.body.pipe(out_stream);
        res.body.once("error", reject);
        out_stream.once("finish", resolve);
    });
}
