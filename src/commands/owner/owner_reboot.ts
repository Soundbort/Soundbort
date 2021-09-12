import { Command } from "../../modules/commands/Command";
import { exit } from "../../util/exit";
import { isOwner } from "../../util/util";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

export default new Command({
    name: "reboot",
    description: "Reboot the bot",
    func(interaction) {
        if (!isOwner(interaction.user.id)) {
            return replyEmbedEphemeral("You need to be a bot developer for that.", EmbedType.Error);
        }

        exit(0);
    },
});
