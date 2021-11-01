import { Command } from "../../modules/commands/Command";
import { CommandGroup } from "../../modules/commands/CommandGroup";
import { createStringOption } from "../../modules/commands/options/createOption";
import { EmbedType, replyEmbed, replyEmbedEphemeral } from "../../util/builders/embed";

import { CustomSample } from "../../core/soundboard/CustomSample";
import { StandardSample } from "../../core/soundboard/StandardSample";

const delete_extern_cmd = new Command({
    name: "extern",
    description: "Delete a custom sample by id.",
    options: [
        createStringOption("id", "Id of the custom sample to delete.", true),
    ],
    async func(interaction) {
        const id = interaction.options.getString("id", true).trim();

        const sample = await CustomSample.findById(id);
        if (!sample) {
            return replyEmbedEphemeral(`Couldn't find sample with id ${id}`, EmbedType.Error);
        }

        await CustomSample.removeCompletely(sample);

        return replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success);
    },
});

const delete_standard_cmd = new Command({
    name: "standard",
    description: "Delete a standard sample by name.",
    options: [
        createStringOption("name", "Name of the standard sample to delete.", true),
    ],
    async func(interaction) {
        const name = interaction.options.getString("name", true).trim();

        const sample = await StandardSample.findByName(name);
        if (!sample) {
            return replyEmbedEphemeral(`Couldn't find sample with name or id ${name}`, EmbedType.Error);
        }

        await StandardSample.remove(sample);

        return replyEmbed(`Removed ${sample.name} from standard soundboard!`, EmbedType.Success);
    },
});

export default new CommandGroup({
    name: "delete",
    description: "Import a sample to standard soundboard.",
    commands: [
        delete_extern_cmd,
        delete_standard_cmd,
    ],
});
