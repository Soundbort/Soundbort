import Discord from "discord.js";

import Logger from "../../log.js";
import { BUTTON_TYPES } from "../../const.js";
import { logErr } from "../../util/util.js";
import * as models from "../../modules/database/models.js";

import InteractionRegistry from "../InteractionRegistry.js";
import StatsCollectorManager from "../managers/StatsCollectorManager.js";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed.js";

const log = Logger.child({ label: "Core => onInteractionCreate" });

export default function onInteractionCreate(stats_collector: StatsCollectorManager) {
    return async (interaction: Discord.Interaction): Promise<void> => {
        if (await models.blacklist_user.findOne({ userId: interaction.user.id })) {
            if (!interaction.isCommand() && !interaction.isButton()) return;

            return await interaction.reply(replyEmbedEphemeral("You're blacklisted from using this bot anywhere.", EmbedType.Error));
        }

        if (interaction.isCommand()) {
            try {
                const command = InteractionRegistry.commands.get(interaction.commandName);
                if (!command) return await interaction.reply(replyEmbedEphemeral("This command doesn't exist anymore or some other thing screwed up.", EmbedType.Error));

                log.debug("Command '%s' by %s in %s (%s)", command.name, interaction.user.id, interaction.channelId, interaction.channel?.type);

                await command.run(interaction);

                stats_collector.incCalledCommands(interaction.commandName, 1);
            } catch (error) {
                log.error({ error: logErr(error) });

                try {
                    const reply = interaction.replied
                        ? interaction.followUp
                        : interaction.reply;
                    await reply(replyEmbedEphemeral("Some error happened.", EmbedType.Error));
                } catch (error) {
                    log.error({ error: logErr(error) });
                }
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            try {
                const command = InteractionRegistry.commands.get(interaction.commandName);
                if (!command) return;

                await command.autocomplete(interaction);
            } catch (error) {
                log.error({ error: logErr(error) });
            }
            return;
        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const decoded = InteractionRegistry.decodeButtonId(customId);
            // building a fallback to the old version so servers don't have to adapt so quickly
            // remove this by, like, September 1st to 8th
            if (customId.startsWith("sample.custom.")) {
                decoded.t = BUTTON_TYPES.PLAY_CUSTOM;
                decoded.id = customId.substring("sample.custom.".length);
            }
            if (customId.startsWith("sample.predef.")) {
                decoded.t = BUTTON_TYPES.PLAY_STANDA;
                decoded.n = customId.substring("sample.predef.".length);
            }

            for (const button_handler of InteractionRegistry.buttons) {
                try {
                    if (!InteractionRegistry.checkButtonFilter(decoded, button_handler.filter)) continue;

                    log.debug("Button '%i' by %s in %s (%s)", decoded.t, interaction.user.id, interaction.channelId, interaction.channel?.type);

                    const result = await button_handler.func(interaction, decoded);

                    stats_collector.incCalledButtons(decoded.t, 1);

                    if (!result || interaction.replied) continue;

                    await interaction.reply(result);
                } catch (error) {
                    log.error({ error: logErr(error) });
                }
            }
        }
    };
}
