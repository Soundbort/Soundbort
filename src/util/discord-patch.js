/**
 * THIS FILE IS TO DIRTY-PATCH DISCORD.JS TO ALLOW READING OUT
 * THE ORIGINAL INTERACTION DATA ON AN INTERACTION OBJECT
 *
 * Until Discord.js has added Attachment Option support this has to be the way
 * to do it.
 */

import InteractionCreateAction from "discord.js/src/client/actions/InteractionCreate";
import * as Discord from "discord.js";
const { Events, InteractionTypes, MessageComponentTypes, ApplicationCommandTypes } = Discord.Constants;

InteractionCreateAction.prototype.handle = function handle(data) {
    const client = this.client;

    // Resolve and cache partial channels for Interaction#channel getter
    this.getChannel(data);

    let InteractionType;
    switch (data.type) {
        case InteractionTypes.APPLICATION_COMMAND:
            switch (data.data.type) {
                case ApplicationCommandTypes.CHAT_INPUT:
                    InteractionType = Discord.CommandInteraction;
                    break;
                case ApplicationCommandTypes.USER:
                    InteractionType = Discord.UserContextMenuInteraction;
                    break;
                case ApplicationCommandTypes.MESSAGE:
                    InteractionType = Discord.MessageContextMenuInteraction;
                    break;
                default:
                    client.emit(
                        Events.DEBUG,
                        `[INTERACTION] Received application command interaction with unknown type: ${data.data.type}`,
                    );
                    return;
            }
            break;
        case InteractionTypes.MESSAGE_COMPONENT:
            switch (data.data.component_type) {
                case MessageComponentTypes.BUTTON:
                    InteractionType = Discord.ButtonInteraction;
                    break;
                case MessageComponentTypes.SELECT_MENU:
                    InteractionType = Discord.SelectMenuInteraction;
                    break;
                default:
                    client.emit(
                        Events.DEBUG,
                        `[INTERACTION] Received component interaction with unknown type: ${data.data.component_type}`,
                    );
                    return;
            }
            break;
        case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE:
            InteractionType = Discord.AutocompleteInteraction;
            break;
        default:
            client.emit(Events.DEBUG, `[INTERACTION] Received interaction with unknown type: ${data.type}`);
            return;
    }

    const interaction = new InteractionType(client, data);
    // Apply _data Property to Interaction object !!!
    Object.defineProperty(interaction, "_data", { value: data.data, writable: false });

    client.emit(Events.INTERACTION_CREATE, interaction);
};
