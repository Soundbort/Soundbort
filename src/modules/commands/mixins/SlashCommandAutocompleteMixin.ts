import * as Discord from "discord.js";

import Logger from "../../../log.js";
import nanoTimer from "../../../util/timer.js";
import { ApplicationCommandOptionChoice } from "../choice/index.js";
import { CommandOptionData } from "../options/index.js";

const log = Logger.child({ label: "SlashCommandAutocomplete" });

export abstract class SlashCommandAutocompleteMixin {
    abstract data: { name: string };

    abstract readonly options: Map<string, CommandOptionData>;

    protected async _autocomplete(interaction: Discord.AutocompleteInteraction): Promise<void> {
        const timer = nanoTimer();

        const focused = interaction.options.getFocused(true);
        const option = this.options.get(focused.name);
        if (!option || !option.autocomplete) return;

        let choices: ApplicationCommandOptionChoice[];

        try {
            // The differentiation is just for Typescript
            if (option.type === Discord.ApplicationCommandOptionType.Number || option.type === Discord.ApplicationCommandOptionType.Integer) {
                choices = await option.autocomplete(focused.value as unknown as number, interaction);
            } else {
                choices = await option.autocomplete(focused.value as unknown as string, interaction);
            }

            // Do not return more than the top 25 choices
            // "data.choices: Must be 25 or fewer in length"
            choices = choices.slice(0, 25);
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
