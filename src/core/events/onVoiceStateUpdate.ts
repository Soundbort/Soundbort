import Discord from "discord.js";

import AudioManager from "../audio/AudioManager";

export default function onVoiceStateUpdate() {
    return (old_state: Discord.VoiceState, new_state: Discord.VoiceState): void => {
        const client = old_state.client;
        if (!client.user) return;

        const subscription = AudioManager.get(new_state.guild.id);
        // if we don't know of such a voice connection, let it stop
        if (!subscription) return;

        if (old_state.id === client.user.id) {
            // if bot has disconnected or was kicked from a voice channel
            if (old_state.channelId && !new_state.channelId) {
                return subscription.destroy();
            }
        } else if (!old_state.channelId) { // if wasn't in a voice channel to begin with, stop
            return;
        }

        const channel = new_state.guild.me?.voice.channel;
        if (!channel) return;

        if (channel.members.filter(m => !m.user.bot).size > 0) return;

        return subscription.destroy();
    };
}
