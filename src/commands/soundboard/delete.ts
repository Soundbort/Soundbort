import registry from "../../core/CommandRegistry";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { TopCommand } from "../../modules/commands/TopCommand";
import { remove } from "../../core/soundboard/methods/remove";

registry.addCommand(new TopCommand({
    name: "delete",
    description: "Remove a sample from one of your soundboards.",
    options: [
        createStringOption("sample", "A sample name or sample identifier (sXXXXXX)", true),
        createStringOption("from", "In case user or server samples have the same name.", false, [
            createChoice("Only search server samples.", "server"),
            createChoice("Only search your user samples.", "user"),
        ]),
    ],
    async func(interaction) {
        const name = interaction.options.getString("sample", true);
        const scope = interaction.options.getString("from", false) as ("user" | "server" | null) || "user";

        await remove(interaction, name, scope);
    },
}));
