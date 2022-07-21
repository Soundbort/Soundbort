import * as Voice from "@discordjs/voice";

import Logger from "../../log";
import { timeout } from "../../util/promises";

const log = Logger.child({ label: "Audio => AudioSubscription" });

// https://github.com/discordjs/voice/blob/main/examples/music-bot/src/music/subscription.ts
export class AudioSubscription {
    public readonly voice_connection: Voice.VoiceConnection;
    public readonly audio_player: Voice.AudioPlayer;
    public ready_lock = false;

    private readonly _onDestroyed: () => void;

    public constructor(voice_connection: Voice.VoiceConnection, onDestroyed: () => void) {
        this.voice_connection = voice_connection;
        this.audio_player = Voice.createAudioPlayer({
            behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Stop },
        });
        this._onDestroyed = onDestroyed;

        this.voice_connection.on("error", error => { log.warn(error); });
        this.voice_connection.on("stateChange", async (oldState: Voice.VoiceConnectionState, newState: Voice.VoiceConnectionState) => {
            if (newState.status === Voice.VoiceConnectionStatus.Disconnected) {
                if (newState.reason === Voice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    /*
                    If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                    but there is a chance the connection will recover itself if the reason of the disconnect was due to
                    switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                    so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                    the voice connection.
					*/
                    try {
                        await Voice.entersState(this.voice_connection, Voice.VoiceConnectionStatus.Connecting, 5000);
                        // Probably moved voice channel
                    } catch {
                        // Probably removed from voice channel
                        if (this.voice_connection.state.status !== Voice.VoiceConnectionStatus.Destroyed) {
                            this.voice_connection.destroy(); // destroy event will bubble up to execute this.stop()
                        }
                    }
                } else if (this.voice_connection.rejoinAttempts < 5) {
                    /*
                    The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
                    await timeout((this.voice_connection.rejoinAttempts + 1) * 5000);
                    this.voice_connection.rejoin();
                } else {
                    /*
                    The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
                    this.voice_connection.destroy(); // destroy event will bubble up to execute this.stop()
                }
            } else if (newState.status === Voice.VoiceConnectionStatus.Destroyed) {
                /*
                Once destroyed, stop the subscription
				*/
                this.stop();
                this._onDestroyed();
            } else if (
                !this.ready_lock
				&& (newState.status === Voice.VoiceConnectionStatus.Connecting || newState.status === Voice.VoiceConnectionStatus.Signalling)
            ) {
                /*
                In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                before destroying the voice connection. This stops the voice connection permanently existing in one of these
                states.
				*/
                this.ready_lock = true;
                try {
                    await Voice.entersState(this.voice_connection, Voice.VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.voice_connection.state.status !== Voice.VoiceConnectionStatus.Destroyed) this.voice_connection.destroy(); // destroy event will bubble up to execute this.stop()
                } finally {
                    this.ready_lock = false;
                }
            }
        });

        this.audio_player.on("stateChange", (oldState: Voice.AudioPlayerState, newState: Voice.AudioPlayerState) => {
            if (oldState.status === Voice.AudioPlayerStatus.Idle && newState.status === Voice.AudioPlayerStatus.Playing) {
                log.debug("Playing audio output on audio player");
            } else if (newState.status === Voice.AudioPlayerStatus.Idle) {
                log.debug("Playback has stopped.");
            }
        });

        this.audio_player.on("error", error => { log.warn(error); });

        this.voice_connection.subscribe(this.audio_player);
    }

    public stop(): void {
        this.audio_player.stop(true);
    }

    // Only for external use
    public destroy(): void {
        this.voice_connection.destroy();
    }
}
