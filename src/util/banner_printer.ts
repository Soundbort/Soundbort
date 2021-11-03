import Discord from "discord.js";
import fs from "fs-extra";
import path from "node:path";
import { PackageJson } from "type-fest";
import { ENVIRONMENT } from "../config.js";

const package_json: PackageJson = fs.readJSONSync(path.join(process.cwd(), "package.json"));

const txt = fs.readFileSync(path.join(process.cwd(), "assets", "banner.txt"), "utf8");
console.log(txt, package_json.version, ENVIRONMENT, Discord.version);
