import { Command } from "../../modules/commands/Command";
import { CommandGroup } from "../../modules/commands/CommandGroup";
import { createStringOption } from "../../modules/commands/options/createOption";
import { EmbedType, isOwner, replyEmbed, replyEmbedEphemeral } from "../../util/util";

import { remove } from "../../core/soundboard/methods/remove";
import { CustomSample } from "../../core/soundboard/sample/CustomSample";
import SampleID from "../../core/soundboard/SampleID";

const delete_extern_cmd = new Command({
    name: "extern",
    description: "Delete a custom sample by id.",
    options: [
        createStringOption("id", "Id of the custom sample to delete.", true),
    ],
    async func(interaction) {
        const userId = interaction.user.id;
        if (!isOwner(userId)) {
            return await interaction.reply(replyEmbedEphemeral("You're not a bot developer, you can't just remove any sample.", EmbedType.Error));
        }

        const id = interaction.options.getString("id", true);

        if (!SampleID.isId(id)) {
            return await interaction.reply(replyEmbedEphemeral(`${id} is not a valid id.`, EmbedType.Error));
        }

        const sample = await CustomSample.findById(id);
        if (!sample) {
            return await interaction.reply(replyEmbedEphemeral(`Couldn't find sample with id ${id}`, EmbedType.Error));
        }

        await CustomSample.removeCompletely(sample);

        return await interaction.reply(replyEmbed(`Removed ${sample.name} (${sample.id}) from user soundboard!`, EmbedType.Success));
    },
});

const delete_standard_cmd = new Command({
    name: "standard",
    description: "Delete a standard sample by name.",
    options: [
        createStringOption("name", "Name of the standard sample to delete.", true),
    ],
    async func(interaction) {
        const name = interaction.options.getString("name", true);

        await remove(interaction, name, "standard");
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
