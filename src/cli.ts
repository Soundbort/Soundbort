#!/usr/bin/env node

/**
 * A CLI tool to interface with the running Soundbort instance
 */

import { Command } from "commander";
import path from "node:path";
import fs from "fs-extra";

import Logger, { printf } from "./log";

const program = new Command();

program.version(fs.readJsonSync(path.join(process.cwd(), "package.json")).version);

program
    .command("logs")
    .description("Scroll and query through the logs.")
    .action(() => {
        Logger.query({ rows: 1000, start: -1000, fields: undefined }, (err, res) => {
            if (err) throw err;

            for (let i = res.dailyRotateFile.length - 1; i > 0; i--) {
                process.stdout.write(printf(res.dailyRotateFile[i]) + "\n");
            }
        });
    });

program.parse(process.argv);
