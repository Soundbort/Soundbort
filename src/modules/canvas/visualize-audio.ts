/**
 * Waveform algorithm built with guidance from https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
 */

import Canvas from "canvas";
import fs from "node:fs";
import { opus } from "prism-media";

import Logger from "../../log";

const log = Logger.child({ label: "Waveform Worker" });

const MAX_VAL_S16 = (2 ** 15) - 1;
const WIDTH = 240;
const HEIGHT = 50;
const PADDING = 10;
const LINE_WIDTH = 2;
const SAMPLES = 40; // Number of samples we want to have in our final data set

function oggToPCMBuffer(ogg_audio_path: string): Promise<Buffer> {
    return new Promise((res, rej): void => {
        const bufs: Buffer[] = [];

        /**
         * convert ogg to pcm using prism-media instead of ffmpeg, because ffmpeg
         * adds a startup time penality
         */

        fs.createReadStream(ogg_audio_path)
            .pipe(new opus.OggDemuxer())
            .pipe(new opus.Decoder({ channels: 1, rate: 48_000, frameSize: 960 })) // use same audio rate as in soundboard/upload.ts
            .on("error", (error: Error) => {
                log.error("prism-media error on pcm transform", error);
                rej(error);
            })
            .on("end", () => {
                res(Buffer.concat(bufs));
            })
            .on("data", (d: Buffer) => {
                bufs.push(d);
            });
    });
}

function toSigned16Bit(buffer: Buffer): Int16Array {
    return new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
}

/**
 * Filters the audio retrieved from an external source
 */
function filterData(audio_buffer: Int16Array): Float32Array {
    const block_size = Math.floor(audio_buffer.length / SAMPLES); // the number of samples in each subdivision
    const filtered_data = new Float32Array(SAMPLES);

    let sum: number, block_start: number, i: number, j: number;
    for (i = 0; i < SAMPLES; i++) {
        block_start = block_size * i; // the location of the first sample in the block
        sum = 0;
        for (j = 0; j < block_size; j++) {
            sum += Math.abs(audio_buffer[block_start + j]); // find the sum of all the samples in the block
        }
        filtered_data[i] = sum / block_size / MAX_VAL_S16; // divide the sum by the block size to get the average
    }

    return filtered_data;
}

/**
 * Normalizes the audio data
 */
function normalizeData(filtered_data: Float32Array): Float32Array {
    const multiplier = Math.pow(Math.max(...filtered_data), -1);
    return filtered_data.map(n => n * multiplier);
}

/**
 * A utility function for drawing our line segments
 * @param {Canvas.CanvasRenderingContext2D} ctx the audio context
 * @param {number} x  the x coordinate of the beginning of the line segment
 * @param {number} height the desired height of the line segment
 */
function drawLineSegment(ctx: Canvas.CanvasRenderingContext2D, x: number, height: number) {
    ctx.beginPath();
    ctx.moveTo(x, -height);
    ctx.lineTo(x, height);
    ctx.stroke();
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

/**
 * Draws the audio file into a canvas element.
 */
function drawToBuffer(normalized_data: Float32Array): Buffer {
    const canvas = Canvas.createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.translate(0, HEIGHT / 2); // set Y = 0 to be in the middle of the canvas

    const gradient = ctx.createLinearGradient(0, -HEIGHT / 2, 0, HEIGHT / 2);
    gradient.addColorStop(0, "#647fd2");
    gradient.addColorStop(0.3, "#647fd2");
    gradient.addColorStop(1, "#5e55c1");

    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.strokeStyle = gradient;

    // draw the line segments
    const segment_spacing = (WIDTH - LINE_WIDTH) / (normalized_data.length - 1);
    for (const [i, normalized_datum] of normalized_data.entries()) {
        const x = (LINE_WIDTH / 2) + (segment_spacing * i);
        const height = clamp((normalized_datum * HEIGHT) - PADDING, 0, (HEIGHT / 2) - (LINE_WIDTH / 2));
        drawLineSegment(ctx, x, height);
    }

    // can't call toBuffer() with callback, because it will break
    // the process in Node 16
    return canvas.toBuffer("image/png", { compressionLevel: 9 });
}

export async function visualizeAudio(ogg_audio_path: string): Promise<Buffer> {
    log.debug("Visualizing %s to %s", ogg_audio_path);

    const start = Date.now();

    try {
        const buffer = await oggToPCMBuffer(ogg_audio_path)
            .then(toSigned16Bit)
            .then(filterData)
            .then(normalizeData)
            .then(drawToBuffer);

        log.debug("finished visualizing %s after %d ms", ogg_audio_path, Date.now() - start);

        return buffer;
    } catch (error) {
        log.error("failed visualizing %s after %d ms", ogg_audio_path, Date.now() - start, error);

        throw error;
    }
}
