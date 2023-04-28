import * as Discord from "discord.js";
import fs from "fs-extra";
import { format } from "node:util";

import { ASSETS_DIR, ENVIRONMENT, VERSION } from "../config.js";

const txt = fs.readFileSync(new URL("banner.txt", ASSETS_DIR), "utf8");
process.stdout.write(format(txt, VERSION, ENVIRONMENT, Discord.version, "\n"));
