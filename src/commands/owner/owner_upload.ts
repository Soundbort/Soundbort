import { SAMPLE_TYPES } from "../../const";

import { Command } from "../../modules/commands/Command";
import { CommandGroup } from "../../modules/commands/CommandGroup";
import { CommandStringOption } from "../../modules/commands/CommandOption";
import { upload } from "../../core/soundboard/methods/upload";

export default new CommandGroup({
    name: "upload",
    description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
    commands: [
        new Command({
            name: "standard",
            description: "Add a sample to standard soundboard. Upload the audio file first, then call this command.",
            options: [
                new CommandStringOption({
                    name: "name",
                    description: "Name for the sample",
                    required: true,
                }),
            ],
            async func(interaction) {
                const name = interaction.options.getString("name", true).trim();

                await upload(interaction, name, SAMPLE_TYPES.STANDARD);
            },
        }),
    ],
});
