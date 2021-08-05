import Discord from "discord.js";

import fs from "fs-extra";
import path from "path";
import { PackageJson } from "type-fest";
import { ENVIRONMENT } from "../../config";

const package_json: PackageJson = fs.readJSONSync(path.join(process.cwd(), "package.json"));

const txt = fs.readFileSync(path.join(__dirname, "..", "..", "..", "assets", "text", "banner.txt"), "utf8");
console.log(txt, package_json.version, ENVIRONMENT, Discord.version, process.versions.node);
