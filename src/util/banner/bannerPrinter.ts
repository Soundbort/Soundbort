import fs from "fs-extra";
import path from "path";

export default function bannerPrinter(environment: string, trixie_v: string, discord_v: string): void {
    const txt = fs.readFileSync(path.join(__dirname, "..", "..", "..", "assets", "text", "banner.txt"), "utf8");
    console.log(txt, trixie_v, environment, discord_v);
}
