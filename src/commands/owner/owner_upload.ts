import { Command } from "../../modules/commands/Command";
import { CommandGroup } from "../../modules/commands/CommandGroup";
import { createStringOption } from "../../modules/commands/options/createOption";
import { upload } from "../../core/soundboard/methods/upload";

export default new CommandGroup({
    name: "upload",
    description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
    commands: [
        new Command({
            name: "standard",
            description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
            options: [
                createStringOption("name", "Name for the sample", true),
            ],
            async func(interaction) {
                const name = interaction.options.getString("name", true);

                await upload(interaction, name, "standard");
            },
        }),
    ],
});
