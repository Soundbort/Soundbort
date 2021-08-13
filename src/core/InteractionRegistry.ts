import { Collection } from "discord.js";
import { TopCommand } from "../modules/commands/TopCommand";
import { TopCommandGroup } from "../modules/commands/TopCommandGroup";

class InteractionRegistry {
    public commands: Collection<string, TopCommand | TopCommandGroup> = new Collection();

    public addCommand(command: TopCommand | TopCommandGroup): void {
        if (this.commands.has(command.name)) throw new Error("Command name already exists");

        this.commands.set(command.name, command);
    }
}

export default new InteractionRegistry();
