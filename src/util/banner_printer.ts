import Discord from "discord.js";
import fs from "fs-extra";
import path from "node:path";
import { PackageJson } from "type-fest";

import { ASSETS_DIR, ENVIRONMENT, PROJECT_ROOT } from "../config.js";

const package_json: PackageJson = fs.readJSONSync(path.join(PROJECT_ROOT, "package.json"));

const txt = fs.readFileSync(path.join(ASSETS_DIR, "banner.txt"), "utf8");
console.log(txt, package_json.version, ENVIRONMENT, Discord.version);
