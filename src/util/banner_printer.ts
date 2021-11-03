import Discord from "discord.js";
import fs from "fs-extra";
import path from "node:path";
import { format } from "node:util";
import { PackageJson } from "type-fest";

import { ASSETS_DIR, ENVIRONMENT, PROJECT_ROOT } from "../config.js";

const package_json: PackageJson = fs.readJSONSync(path.join(PROJECT_ROOT, "package.json"));

const txt = fs.readFileSync(path.join(ASSETS_DIR, "banner.txt"), "utf8");
process.stdout.write(format(txt, package_json.version, ENVIRONMENT, Discord.version, "\n"));
