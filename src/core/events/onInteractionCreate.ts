import * as Discord from "discord.js";

import Logger from "../../log";
import { BUTTON_TYPES } from "../../const";
import { EmbedType, replyEmbedEphemeral } from "../../util/builders/embed";

import InteractionRegistry from "../InteractionRegistry";
import BlacklistManager from "../data-managers/BlacklistManager";
import StatsCollectorManager from "../data-managers/StatsCollectorManager";

const log = Logger.child({ label: "Core => onInteractionCreate" });

export default function onInteractionCreate(registry: InteractionRegistry) {
    return async (interaction: Discord.Interaction): Promise<void> => {
        if (await BlacklistManager.isBlacklisted(interaction.user.id)) {
            if (!interaction.isCommand() && !interaction.isButton()) return;

            return await interaction.reply(replyEmbedEphemeral("You're blacklisted from using this bot anywhere.", EmbedType.Error));
        }

        if (interaction.isCommand()) {
            try {
                const command = registry.commands.get(interaction.commandName);
                if (!command) return await interaction.reply(replyEmbedEphemeral("This command doesn't exist anymore or some other thing screwed up.", EmbedType.Error));

                log.debug("Command '%s' by %s in %s (%s)", command.data.name, interaction.user.id, interaction.channelId, interaction.channel?.type);

                await command.run(interaction);

                StatsCollectorManager.incCalledCommands(interaction.commandName, 1);
            } catch (error) {
                log.error(error);

                try {
                    const reply = interaction.replied
                        ? interaction.followUp
                        : interaction.reply;
                    await reply(replyEmbedEphemeral("Some error happened.", EmbedType.Error));
                } catch (error) {
                    log.error(error);
                }
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            try {
                const command = registry.commands.get(interaction.commandName);
                if (!command) return;

                await command.autocomplete(interaction);
            } catch (error) {
                log.error(error);
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
                decoded.id = customId.slice("sample.custom.".length);
            }
            if (customId.startsWith("sample.predef.")) {
                decoded.t = BUTTON_TYPES.PLAY_STANDA;
                decoded.n = customId.slice("sample.predef.".length);
            }

            for (const button_handler of registry.buttons) {
                try {
                    if (!InteractionRegistry.checkButtonFilter(decoded, button_handler.filter)) continue;

                    log.debug("Button '%i' by %s in %s (%s)", decoded.t, interaction.user.id, interaction.channelId, interaction.channel?.type);

                    const result = await button_handler.func(interaction, decoded);

                    StatsCollectorManager.incCalledButtons(decoded.t, 1);

                    if (!result || interaction.replied) continue;

                    await interaction.reply(result);
                } catch (error) {
                    log.error(error);
                }
            }
        }
    };
}
