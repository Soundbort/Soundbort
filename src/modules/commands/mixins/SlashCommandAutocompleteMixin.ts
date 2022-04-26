import { ApplicationCommandOptionType } from "discord-api-types/v10";
import * as Discord from "discord.js";

import Logger from "../../../log";
import nanoTimer from "../../../util/timer";
import { CommandOptionData } from "../options";

const log = Logger.child({ label: "SlashCommandAutocomplete" });

export abstract class SlashCommandAutocompleteMixin {
    abstract data: { name: string };

    abstract readonly options: Map<string, CommandOptionData>;

    protected async _autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        const timer = nanoTimer();

        const focused = interaction.options.getFocused(true);
        const option = this.options.get(focused.name);
        if (!option || !option.autocomplete) return;

        let choices: Discord.ApplicationCommandOptionChoice[];

        try {
            // The differentiation is just for Typescript
            if (option.type === ApplicationCommandOptionType.Number || option.type === ApplicationCommandOptionType.Integer) {
                choices = await option.autocomplete(focused.value as number, interaction);
            } else {
                choices = await option.autocomplete(focused.value as string, interaction);
            }
        } catch (error) {
            const exec_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_MS;
            log.debug("%s='%s' for '%s' by %s in %s (%s) finished in %sms", focused.name, focused.value, this.data.name, interaction.user.id, interaction.channelId, interaction.channel?.type, exec_time.toFixed(3));

            throw error;
        }

        const exec_time = nanoTimer.diff(timer) / nanoTimer.NS_PER_MS;
        log.debug("%s='%s' for '%s' by %s in %s (%s) finished in %sms", focused.name, focused.value, this.data.name, interaction.user.id, interaction.channelId, interaction.channel?.type, exec_time.toFixed(3));

        await interaction.respond(choices);
    }
}
