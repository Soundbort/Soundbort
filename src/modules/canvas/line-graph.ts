import { createCanvas, GlobalFonts, SKRSContext2D } from "@napi-rs/canvas";
import path from "node:path";
import color from "color";
import moment from "moment";

import { lastItem } from "../../util/array";
import { ASSETS_DIR } from "../../config";
import { COLOR } from "../../const";

GlobalFonts.registerFromPath(path.join(ASSETS_DIR, "fonts", "Roboto-Regular.ttf"), "Roboto Regular");
GlobalFonts.registerFromPath(path.join(ASSETS_DIR, "fonts", "Roboto-Bold.ttf"), "Roboto Bold");

const WHITE_COLOR = color(COLOR.CHART_BG, "rgb").string();
const LEGEND_TEXT_COLOR = color(COLOR.CHART_FG, "rgb").mix(color(COLOR.CHART_BG, "rgb"), 0.4).string();
const TEXT_COLOR = color(COLOR.CHART_FG, "rgb").string();

const SCALE = 2;
const BORDER_RADIUS = 12;
const GRAPH_PADDING = 16;
const LEGEND_PADDING = 8;
const FONT = "'Roboto Regular'";
const FONT_BOLD = "'Roboto Bold'";
const FONT_SIZE = 10;
const TITLE_FONT_SIZE = 14;
const LABEL_X_HEIGHT = FONT_SIZE + LEGEND_PADDING;

type ResolutionXTable = [number, number, string, moment.unitOfTime.StartOf][];

export interface ChartOptionsData {
    points: {
        x: number;
        y: number;
    }[];
    color: string;
    label?: string;
}

export interface ChartOptionsAxies {
    min?: number;
    max?: number;
    label_suffix?: string;
}

export interface ChartOptions {
    title?: string;
    data: ChartOptionsData[];
    x?: ChartOptionsAxies;
    y?: ChartOptionsAxies;
}

interface ChartOptionsInternAxies extends ChartOptionsAxies {
    min: number;
    max: number;
    diff: number;
}

interface ChartOptionsIntern extends ChartOptions {
    width: number;
    height: number;

    x: ChartOptionsInternAxies;
    y: ChartOptionsInternAxies;

    increment_y: number;
}

function strokeLine(ctx: SKRSContext2D, x0: number, y0: number, x1: number, y1: number): void {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawLegendY(ctx: SKRSContext2D, opts: ChartOptionsIntern) {
    ctx.save();

    ctx.fillStyle = LEGEND_TEXT_COLOR;
    ctx.font = `${FONT_SIZE}px ${FONT}, sans-serif`;
    ctx.textAlign = "end";
    ctx.textBaseline = "middle";

    const y_legend: {
        y: number;
        width: number;
        label: string;
    }[] = [];

    let legend_width = 0;
    for (let y = 0; y <= opts.y.max; y += opts.increment_y) {
        if (y < opts.y.min) continue;

        let label = y.toLocaleString("en");
        if (opts.y.label_suffix) label += " " + opts.y.label_suffix;

        const label_width = ctx.measureText(label).width;
        if (label_width > legend_width) legend_width = label_width;

        y_legend.push({
            y: y,
            width: label_width,
            label: label,
        });
    }

    for (const legend of y_legend) {
        const draw_y = opts.height - ((legend.y - opts.y.min) / opts.y.diff * opts.height);
        ctx.fillText(legend.label, legend_width, draw_y);
    }

    ctx.restore();

    return legend_width;
}

function drawGrid(ctx: SKRSContext2D, opts: ChartOptionsIntern) {
    ctx.save();
    ctx.strokeStyle = LEGEND_TEXT_COLOR;
    ctx.globalAlpha = 0.5;

    for (let y = 0; y <= opts.y.max; y += opts.increment_y) {
        if (y < opts.y.min) continue;

        const draw_y = opts.height - ((y - opts.y.min) / opts.y.diff * opts.height);

        strokeLine(ctx, 0, draw_y, opts.width, draw_y);
    }

    ctx.restore();
}

function createTimeWindowTable(x_diff: number): ResolutionXTable {
    return [
        // timespan, max divider, legend format, legend increment begin
        [x_diff / (1000), 10, "mm:ss.SS", "second"], // seconds
        [x_diff / (1000 * 10), 10, "mm:ss.SS", "second"], // 10 seconds
        [x_diff / (1000 * 60), 60, "H:mm:ss", "second"], // minutes
        [x_diff / (1000 * 60 * 60), 60, "HH:mm", "minute"], // hours
        [x_diff / (1000 * 60 * 60 * 12), 12, "HH:mm", "hour"], // days
        [x_diff / (1000 * 60 * 60 * 24), 24, "HH:mm", "hour"], // days
        [x_diff / (1000 * 60 * 60 * 24 * 3), 24, "dd H:mm", "hour"], // 3 days
        [x_diff / (1000 * 60 * 60 * 24 * 7), 7 * 4, "dd H:mm", "day"], // weeks
        [x_diff / (1000 * 60 * 60 * 24 * 28), 28, "D MMM", "date"], // months
        [x_diff / (1000 * 60 * 60 * 24 * 365), 12, "MMM", "month"], // years
        [x_diff / (1000 * 60 * 60 * 24 * 365 * 10), 120 / 4, "MMM", "month"], // 10 years
    ].reverse() as ResolutionXTable;
}

function drawLegendX(ctx: SKRSContext2D, opts: ChartOptionsIntern) {
    ctx.save();

    ctx.strokeStyle = LEGEND_TEXT_COLOR;

    ctx.fillStyle = LEGEND_TEXT_COLOR;
    ctx.font = `${FONT_SIZE}px ${FONT}, sans-serif`;
    ctx.textAlign = "center";

    const resolution_x_table = createTimeWindowTable(opts.x.diff);

    let diff_x_match;
    for (const item of resolution_x_table) {
        if (item[0] < 1) continue;
        diff_x_match = item;
        break;
    }
    if (!diff_x_match) return;

    const [_timespan_ratio, _max_divider, format_x, _legend_increment_begin] = diff_x_match;
    const max_divider = _max_divider * _timespan_ratio;

    const increment_end = moment(opts.x.max).startOf(_legend_increment_begin).valueOf();

    const padding = 8;
    let test_label = moment("23:59", "HH:mm").format(format_x);
    if (opts.x.label_suffix) test_label += " " + opts.x.label_suffix;
    const element_width = ctx.measureText(test_label).width + padding;

    const max_elements = Math.max(1, Math.floor(opts.width / element_width));

    let recommended_elements: number = 1;
    for (let i = 1; i <= max_divider; i++) {
        recommended_elements = Math.floor(max_divider / i);
        if (recommended_elements <= max_elements) {
            break;
        }
    }

    const delta_legend_x = opts.x.diff / recommended_elements;

    const legende_x: {
        x: number;
        draw_x: number;
        width: number;
        label: string;
    }[] = [];

    for (let x = increment_end; x >= opts.x.min; x -= delta_legend_x) {
        let label = moment(x).format(format_x);
        if (opts.x.label_suffix) label += " " + opts.x.label_suffix;
        const label_width = ctx.measureText(label).width;
        const draw_x = (x - opts.x.min) / opts.x.diff * opts.width;

        legende_x.push({
            x: x,
            draw_x: draw_x,
            width: label_width,
            label: label,
        });
    }

    ctx.globalAlpha = 0.5;
    for (const legend of legende_x) {
        strokeLine(ctx,
            legend.draw_x, opts.height - FONT_SIZE - LEGEND_PADDING,
            legend.draw_x, opts.height - FONT_SIZE - 2,
        );
    }

    legende_x.sort((a, b) => a.x - b.x);

    const legend_start = legende_x[0];
    const item_x_start = legend_start.draw_x - (legend_start.width / 2);
    const overshoot_start = Math.max(0, -item_x_start);

    const legend_end = lastItem(legende_x);
    const item_x_end = legend_end.draw_x + (legend_end.width / 2);
    const overshoot_end = Math.max(0, item_x_end - opts.width);

    ctx.globalAlpha = 1;
    for (const legend of legende_x) {
        ctx.fillText(legend.label, legend.draw_x + overshoot_start - overshoot_end, opts.height);
    }

    ctx.restore();
}

function drawLine(ctx: SKRSContext2D, data: ChartOptionsData, opts: ChartOptionsIntern) {
    ctx.save();
    ctx.strokeStyle = data.color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();

    if (data.points.length > 1) {
        const data_per_pix = Math.max(1, (data.points.length - 1) / opts.width);

        const draw_y = opts.height - ((data.points[0].y - opts.y.min) / opts.y.diff * opts.height);
        ctx.moveTo(0, draw_y);

        for (let i = 1; i < data.points.length; i += data_per_pix) {
            const curr = data.points[Math.floor(i)];
            if (curr.x < opts.x.min) continue;
            if (curr.x > opts.x.max) break;

            const draw_y = opts.height - ((curr.y - opts.y.min) / opts.y.diff * opts.height);
            const draw_x = Math.round((curr.x - opts.x.min) / opts.x.diff * opts.width);

            ctx.lineTo(draw_x, draw_y);
        }
    } else if (data.points.length === 1) {
        const draw_y = opts.height - (((data.points[0].y - opts.y.min) / opts.y.diff) * opts.height);
        ctx.moveTo(0, draw_y);
        ctx.lineTo(opts.width, draw_y);
    } else {
        ctx.moveTo(0, opts.height);
        ctx.lineTo(opts.width, opts.height);
    }

    ctx.stroke();

    ctx.lineTo(opts.width, opts.height);
    ctx.lineTo(0, opts.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, opts.height);

    const rgb = color(data.color);
    gradient.addColorStop(0, rgb.alpha(0.2).string());
    gradient.addColorStop(0.3, rgb.alpha(0.05).string());
    gradient.addColorStop(1, rgb.alpha(0).string());

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function drawLineChart(ctx: SKRSContext2D, opts: ChartOptionsIntern): void {
    ctx.lineWidth = 1;

    const legend_y_width = drawLegendY(ctx, { ...opts, height: opts.height - LABEL_X_HEIGHT });

    ctx.save();
    ctx.translate(legend_y_width + LEGEND_PADDING, 0);

    drawGrid(ctx, {
        ...opts,
        width: opts.width - (legend_y_width + LEGEND_PADDING),
        height: opts.height - LABEL_X_HEIGHT,
    });
    drawLegendX(ctx, {
        ...opts,
        width: opts.width - (legend_y_width + LEGEND_PADDING),
    });

    for (const data of opts.data) {
        drawLine(ctx, data, {
            ...opts,
            width: opts.width - (legend_y_width + 8),
            height: opts.height - LABEL_X_HEIGHT,
        });
    }

    ctx.restore();
}

function drawTitle(ctx: SKRSContext2D, title: string): void {
    ctx.save();

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `${TITLE_FONT_SIZE}px ${FONT_BOLD}, sans-serif`;
    ctx.textBaseline = "top";

    ctx.fillText(title, 0, 0);

    ctx.restore();
}

function drawBG(ctx: SKRSContext2D, { width, height }: { width: number; height: number }): void {
    ctx.save();

    ctx.fillStyle = WHITE_COLOR;
    ctx.strokeStyle = WHITE_COLOR;
    ctx.lineJoin = "round";
    ctx.lineWidth = BORDER_RADIUS * 2;

    ctx.strokeRect(BORDER_RADIUS, BORDER_RADIUS, width - (BORDER_RADIUS * 2), height - (BORDER_RADIUS * 2));
    ctx.fillRect(BORDER_RADIUS, BORDER_RADIUS, width - (BORDER_RADIUS * 2), height - (BORDER_RADIUS * 2));

    ctx.restore();
}

function drawDataLabels(ctx: SKRSContext2D, data_arr: ChartOptionsData[]): void {
    ctx.save();

    ctx.translate(0, (FONT_SIZE / 2));

    let x_offset = 0;
    for (const data of data_arr) {
        if (!data.label) continue;

        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(x_offset + (FONT_SIZE / 2), 0, (FONT_SIZE / 2), 0, 2 * Math.PI, false);
        ctx.fill();

        x_offset += (FONT_SIZE / 2) + LEGEND_PADDING;

        ctx.fillStyle = LEGEND_TEXT_COLOR;
        ctx.font = `${FONT_SIZE}px ${FONT}, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(data.label, x_offset, 0);

        x_offset += ctx.measureText(data.label).width + (LEGEND_PADDING * 2);
    }

    ctx.restore();
}

function fixInputsXY(data: ChartOptionsData[], xy: ChartOptionsAxies | undefined, axies: "x" | "y"): ChartOptionsInternAxies {
    const xy_min_data = axies === "y"
        ? 0
        : Math.min(...data.map(data => data.points[0][axies]));
    const xy_max_data = axies === "y"
        ? Math.max(...data.map(data => Math.max(...data.points.map(p => p.y))))
        : Math.max(...data.map(data => lastItem(data.points)[axies]));

    let xy_min = (!xy || xy.min === undefined) ? xy_min_data : xy.min;
    let xy_max = (!xy || xy.max === undefined) ? xy_max_data : xy.max;

    // ensure a minimum distance between min and max
    const xy_window_padding = 1;
    const xy_middle = Math.max(
        xy_window_padding,
        xy_min + ((xy_max - xy_min) / 2), // larp at 50%
    );
    xy_min = Math.min(xy_min, xy_middle - xy_window_padding);
    xy_max = Math.max(xy_max, xy_middle + xy_window_padding);

    const xy_diff = xy_max - xy_min;

    return {
        min: xy_min,
        max: xy_max,
        diff: xy_diff,
        label_suffix: xy?.label_suffix,
    };
}

export async function lineGraph(opts: ChartOptions): Promise<Buffer> {
    const x = fixInputsXY(opts.data, opts.x, "x");
    const y = fixInputsXY(opts.data, opts.y, "y");

    const y_delta_legend = (y.diff) / Math.min(y.diff, 5);
    const y_exp = Math.floor(Math.log10(y_delta_legend));
    const y_round = Math.pow(10, y_exp);
    const y_increment = Math.round(y_delta_legend / y_round) * y_round;

    const has_data_labels = opts.data.some(data => typeof data.label === "string");

    let title_height = 0;
    if (opts.title) {
        title_height += TITLE_FONT_SIZE + (LEGEND_PADDING * 2);
    }
    let label_height = 0;
    if (has_data_labels) {
        label_height += FONT_SIZE + (LEGEND_PADDING * 2);
    }

    const width = 400;
    const height = 170;

    const canvas = createCanvas(
        Math.round(width * SCALE),
        Math.round((height + title_height + label_height) * SCALE),
    );
    const ctx = canvas.getContext("2d");

    ctx.scale(SCALE, SCALE);

    drawBG(ctx, { width: canvas.width / SCALE, height: canvas.height / SCALE });

    ctx.translate(GRAPH_PADDING, GRAPH_PADDING);

    if (opts.title) {
        drawTitle(ctx, opts.title);
    }

    ctx.translate(0, title_height);

    const chart_data_intern: ChartOptionsIntern = {
        width: width - (GRAPH_PADDING * 2),
        height: height - (GRAPH_PADDING * 2),
        data: opts.data,
        x, y,
        increment_y: y_increment,
    };

    drawLineChart(ctx, chart_data_intern);

    if (has_data_labels) {
        ctx.translate(0, (height - (GRAPH_PADDING * 2)) + (LEGEND_PADDING * 2));
        drawDataLabels(ctx, opts.data);
    }

    return await canvas.encode("png");
}
