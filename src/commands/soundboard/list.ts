import registry from "../../core/CommandRegistry";
import { TopCommand } from "../../modules/commands/TopCommand";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import { list } from "../../core/soundboard/methods/list";

registry.addCommand(new TopCommand({
    name: "list",
    description: "Generate a list of all accessable samples with clickable buttons to trigger them.",
    options: [
        createStringOption("from", "What soundboards to output.", false, [
            createChoice("Output all soundboards (standard, server and user soundboards).", "all"),
            createChoice("Output standard soundboard only.", "standard"),
            createChoice("Output this server's soundboard only.", "server"),
            createChoice("Output your own soundboard only.", "user"),
        ]),
    ],
    async func(interaction) {
        const scope = interaction.options.getString("from") as ("all" | "standard" | "server" | "user" | null) || "all";

        await list(interaction, scope);
    },
}));
