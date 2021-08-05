import registry from "../../core/CommandRegistry";
import { TopCommand } from "../../modules/commands/TopCommand";
import { createStringOption } from "../../modules/commands/options/createOption";
import { createChoice } from "../../modules/commands/options/createChoice";
import SoundboardManager from "../../core/soundboard/SoundboardManager";

registry.addCommand(new TopCommand({
    name: "upload",
    description: "Add a sound sample to your soundboard. Upload the audio file first, then call this command.",
    options: [
        createStringOption("name", "Name for the sample", true),
        createStringOption("to", "Choose the soundboard to add the sound to. Defaults to your personal soundboard.", false, [
            createChoice("Upload into your personal soundboard.", "user"),
            createChoice("Upload into server soundboard for every member to use.", "server"),
        ]),
    ],
    async func(interaction) {
        const name = interaction.options.getString("name", true);
        const scope = interaction.options.getString("to", false) as ("user" | "server" | null) || "user";

        await SoundboardManager.upload(interaction, name, scope);
    },
}));
