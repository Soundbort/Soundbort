import { createCanvas, CanvasRenderingContext2D, registerFont } from "canvas";
import path from "path";
import color from "color";
import moment from "moment";
import { lastItem } from "../../util/array";
import { PROJECT_ROOT } from "../../config";
import { COLOR } from "../../const";

registerFont(path.join(PROJECT_ROOT, "assets", "fonts", "Roboto-Regular.ttf"), { family: "Roboto-Regular" });
registerFont(path.join(PROJECT_ROOT, "assets", "fonts", "Roboto-Bold.ttf"), { family: "Roboto-Bold" });

const WHITE_COLOR = color(COLOR.WHITE, "rgb").string();
const LEGEND_TEXT_COLOR = color(COLOR.TEXT, "rgb").mix(color(COLOR.WHITE, "rgb"), 0.4).string();
const TEXT_COLOR = color(COLOR.TEXT, "rgb").string();

const SCALE = 2;
const BORDER_RADIUS = 12;
const GRAPH_PADDING = 16;
const LEGEND_PADDING = 8;
const FONT = "Roboto-Regular";
const FONT_BOLD = "Roboto-Bold";
const FONT_SIZE = 10;
const TITLE_FONT_SIZE = 14;
const LABEL_X_HEIGHT = FONT_SIZE + LEGEND_PADDING;

export interface ChartOptionsData {
    points: {
        x: number;
        y: number;
    }[];
    color: string;
}

export interface ChartOptionsAxies {
    min?: number;
    max?: number;
}

export interface ChartOptions {
    title?: string;
    data: ChartOptionsData[];
    x?: ChartOptionsAxies;
    y?: ChartOptionsAxies;
}

type ResolutionXTable = [number, number, string, moment.unitOfTime.StartOf][];

interface ChartOptionsIntern extends ChartOptions {
    width: number;
    height: number;

    x: {
        min: number;
        max: number;
        diff: number;
    };
    y: {
        min: number;
        max: number;
        diff: number;
    };

    increment_y: number;
}

function drawLegendY(ctx: CanvasRenderingContext2D, { height, y: _y, increment_y }: ChartOptionsIntern) {
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
    for (let y = 0; y <= _y.max; y += increment_y) {
        if (y < _y.min) continue;

        const label = y.toLocaleString("en");
        const label_width = ctx.measureText(label).width;
        if (label_width > legend_width) legend_width = label_width;

        y_legend.push({
            y: y,
            width: label_width,
            label: label,
        });
    }

    for (const legend of y_legend) {
        const draw_y = height - ((legend.y - _y.min) / _y.diff * height);
        ctx.fillText(legend.label, legend_width, draw_y);
    }

    ctx.restore();
    return legend_width;
}

function drawGrid(ctx: CanvasRenderingContext2D, { width, height, y: _y, increment_y }: ChartOptionsIntern) {
    ctx.save();
    ctx.strokeStyle = LEGEND_TEXT_COLOR;
    ctx.globalAlpha = 0.5;

    for (let y = 0; y <= _y.max; y += increment_y) {
        if (y < _y.min) continue;

        const draw_y = height - ((y - _y.min) / _y.diff * height);

        ctx.beginPath();
        ctx.moveTo(0, draw_y);
        ctx.lineTo(width, draw_y);
        ctx.stroke();
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
        [x_diff / (1000 * 60 * 60 * 24), 24, "HH:mm", "hour"], // days
        [x_diff / (1000 * 60 * 60 * 24 * 3), 24, "dd H:mm", "hour"], // 3 days
        [x_diff / (1000 * 60 * 60 * 24 * 7), 7 * 4, "dd H:mm", "day"], // weeks
        [x_diff / (1000 * 60 * 60 * 24 * 28), 28, "D MMM", "date"], // months
        [x_diff / (1000 * 60 * 60 * 24 * 365), 12, "MMM", "month"], // years
        [x_diff / (1000 * 60 * 60 * 24 * 365 * 10), 120 / 4, "MMM", "month"], // 10 years
    ].reverse() as ResolutionXTable;
}

function drawLegendX(ctx: CanvasRenderingContext2D, { width, height, x: _x }: ChartOptionsIntern) {
    ctx.save();

    ctx.strokeStyle = LEGEND_TEXT_COLOR;

    ctx.fillStyle = LEGEND_TEXT_COLOR;
    ctx.font = `${FONT_SIZE}px ${FONT}, sans-serif`;
    ctx.textAlign = "center";

    const resolution_x_table = createTimeWindowTable(_x.diff);

    let diff_x_match;
    for (const item of resolution_x_table) {
        if (item[0] < 1) continue;
        diff_x_match = item;
        break;
    }
    if (!diff_x_match) return;

    const [_timespan_ratio, _max_divider, format_x, _legend_increment_begin] = diff_x_match;
    const max_divider = _max_divider * _timespan_ratio;

    const increment_end = moment(_x.max).startOf(_legend_increment_begin).valueOf();

    const padding = 8;
    const test_label = moment("23:59", "HH:mm").format(format_x);
    const element_width = ctx.measureText(test_label).width + padding;

    const max_elements = Math.max(1, Math.floor(width / element_width));

    let recommended_elements: number = 1;
    for (let i = 1; i <= max_divider; i++) {
        recommended_elements = Math.floor(max_divider / i);
        if (recommended_elements <= max_elements) {
            break;
        }
    }

    const delta_legend_x = _x.diff / recommended_elements;

    const legende_x: {
        x: number;
        draw_x: number;
        width: number;
        label: string;
    }[] = [];

    for (let x = increment_end; x >= _x.min; x -= delta_legend_x) {
        const label = moment(x).format(format_x);
        const label_width = ctx.measureText(label).width;
        const draw_x = (x - _x.min) / _x.diff * width;

        legende_x.push({
            x: x,
            draw_x: draw_x,
            width: label_width,
            label: label,
        });
    }

    ctx.globalAlpha = 0.5;
    for (const legend of legende_x) {
        ctx.beginPath();
        ctx.moveTo(legend.draw_x, height - FONT_SIZE - LEGEND_PADDING);
        ctx.lineTo(legend.draw_x, height - FONT_SIZE - 2);
        ctx.stroke();
    }

    legende_x.sort((a, b) => a.x - b.x);

    const legend_start = legende_x[0];
    const item_x_start = legend_start.draw_x - (legend_start.width / 2);
    const overshoot_start = Math.max(0, -item_x_start);

    const legend_end = lastItem(legende_x);
    const item_x_end = legend_end.draw_x + (legend_end.width / 2);
    const overshoot_end = Math.max(0, item_x_end - width);

    ctx.globalAlpha = 1;
    for (const legend of legende_x) {
        ctx.fillText(legend.label, legend.draw_x + overshoot_start - overshoot_end, height);
    }

    ctx.restore();
}

function drawLine(ctx: CanvasRenderingContext2D, { width, height, x: _x, y: _y }: ChartOptionsIntern, data: ChartOptionsData) {
    ctx.save();
    ctx.strokeStyle = data.color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();

    if (data.points.length > 1) {
        const data_per_pix = Math.max(1, (data.points.length - 1) / width);

        const draw_y = height - ((data.points[0].y - _y.min) / _y.diff * height);
        ctx.moveTo(0, draw_y);

        for (let i = 1; i < data.points.length; i += data_per_pix) {
            const curr = data.points[Math.floor(i)];
            if (curr.x < _x.min) continue;
            if (curr.x > _x.max) break;

            const draw_y = height - ((curr.y - _y.min) / _y.diff * height);
            const draw_x = Math.round((curr.x - _x.min) / _x.diff * width);

            ctx.lineTo(draw_x, draw_y);
        }
    } else if (data.points.length === 1) {
        const draw_y = height - (((data.points[0].y - _y.min) / _y.diff) * height);
        ctx.moveTo(0, draw_y);
        ctx.lineTo(width, draw_y);
    } else {
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
    }

    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    const rgb = color(data.color);
    gradient.addColorStop(0, rgb.alpha(0.2).string());
    gradient.addColorStop(0.3, rgb.alpha(0.05).string());
    gradient.addColorStop(1, rgb.alpha(0).string());

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function drawLineChart(ctx: CanvasRenderingContext2D, chart_data_intern: ChartOptionsIntern): void {
    const { height, width } = chart_data_intern;

    ctx.lineWidth = 1;

    const legend_y_width = drawLegendY(ctx, { ...chart_data_intern, height: height - LABEL_X_HEIGHT });

    ctx.save();
    ctx.translate(legend_y_width + LEGEND_PADDING, 0);

    drawGrid(ctx, { ...chart_data_intern, width: width - (legend_y_width + LEGEND_PADDING), height: height - LABEL_X_HEIGHT });
    drawLegendX(ctx, { ...chart_data_intern, width: width - (legend_y_width + LEGEND_PADDING) });

    for (const data of chart_data_intern.data) {
        drawLine(ctx, { ...chart_data_intern, width: width - (legend_y_width + 8), height: height - LABEL_X_HEIGHT }, data);
    }

    ctx.restore();
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string): void {
    ctx.save();

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `${TITLE_FONT_SIZE}px ${FONT_BOLD}, sans-serif`;
    ctx.textBaseline = "top";

    ctx.fillText(title, 0, 0);

    ctx.restore();
}

function drawBG(ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }): void {
    ctx.save();

    ctx.fillStyle = WHITE_COLOR;
    ctx.strokeStyle = WHITE_COLOR;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = BORDER_RADIUS * 2;

    ctx.strokeRect(BORDER_RADIUS, BORDER_RADIUS, width - (BORDER_RADIUS * 2), height - (BORDER_RADIUS * 2));
    ctx.fillRect(BORDER_RADIUS, BORDER_RADIUS, width - (BORDER_RADIUS * 2), height - (BORDER_RADIUS * 2));

    ctx.restore();
}

export function lineGraph(opts: ChartOptions): Buffer {
    const x_min_data = Math.min(...opts.data.map(data => data.points[0].x));
    const x_max_data = Math.min(...opts.data.map(data => lastItem(data.points).x));

    let x_min = (!opts.x || typeof opts.x.min === "undefined") ? x_min_data : opts.x.min;
    let x_max = (!opts.x || typeof opts.x.max === "undefined") ? x_max_data : opts.x.max;
    let x_diff = x_max - x_min;
    const x_window_padding = 1;
    const x_middle = x_min + (x_diff / 2);

    x_min = Math.min(x_min, x_middle - x_window_padding);
    x_max = Math.max(x_max, x_middle + x_window_padding);

    x_diff = x_max - x_min;

    const x = {
        min: x_min,
        max: x_max,
        diff: x_diff,
    };

    const y_max_data = Math.max(...opts.data.map(data => Math.max(...data.points.map(p => p.y))));

    let y_min = (!opts.y || typeof opts.y.min === "undefined") ? 0 : opts.y.min;
    let y_max = (!opts.y || typeof opts.y.max === "undefined") ? y_max_data : opts.y.max;
    let y_diff = y_max - y_min;
    const y_window_padding = 1;
    const y_middle = Math.max(y_window_padding, y_min + (y_diff / 2));

    y_min = Math.min(y_min, y_middle - y_window_padding);
    y_max = Math.max(y_max, y_middle + y_window_padding);

    y_diff = y_max - y_min;

    const y = {
        min: y_min,
        max: y_max,
        diff: y_diff,
    };

    const y_delta_legend = (y.diff) / Math.min(y.diff, 5);
    const y_exp = Math.round(Math.log10(y_delta_legend));
    const y_round = Math.pow(10, y_exp);
    const y_increment = Math.round(y_delta_legend / y_round) * y_round;

    const width = 400;
    const height = 200;
    const canvas = createCanvas(
        Math.round(width * SCALE),
        Math.round(height * SCALE),
    );
    const ctx = canvas.getContext("2d");

    ctx.scale(SCALE, SCALE);

    drawBG(ctx, { width, height });

    ctx.translate(GRAPH_PADDING, GRAPH_PADDING);

    let y_offset = 0;
    if (opts.title) {
        drawTitle(ctx, opts.title);
        y_offset = TITLE_FONT_SIZE + (LEGEND_PADDING * 2);
    }

    ctx.translate(0, y_offset);

    const chart_data_intern: ChartOptionsIntern = {
        width: width - (GRAPH_PADDING * 2),
        height: (opts.title ? height - y_offset : canvas.height) - (GRAPH_PADDING * 2.5),
        data: opts.data,
        x, y,
        increment_y: y_increment,
    };

    drawLineChart(ctx, chart_data_intern);

    // can't call toBuffer() with callback, because it will break
    // the process in Node 16
    // return new Promise((resolve, reject) => {
    //     canvas.toBuffer(
    //         (err, buffer) => {
    //             if (err) reject(err);
    //             else resolve(buffer);
    //         },
    //         "image/png",
    //         { compressionLevel: 9 },
    //     );
    // });
    return canvas.toBuffer(
        "image/png",
        { compressionLevel: 9 },
    );
}
