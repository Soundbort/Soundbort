import { SAMPLE_TYPES } from "../../const.js";

import { Command } from "../../modules/commands/Command.js";
import { CommandGroup } from "../../modules/commands/CommandGroup.js";
import { CommandStringOption } from "../../modules/commands/CommandOption.js";

import { upload } from "../../core/soundboard/methods/upload.js";

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
