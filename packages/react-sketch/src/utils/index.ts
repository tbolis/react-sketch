import type { LineStyle } from "../types";

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate the distance of two x,y points
 *
 * @param point1 an object with x,y attributes representing the start point
 * @param point2 an object with x,y attributes representing the end point
 *
 * @returns {number}
 */
export const linearDistance = (point1: Point, point2: Point): number => {
  const xs = point2.x - point1.x;
  const ys = point2.y - point1.y;
  return Math.sqrt(xs * xs + ys * ys);
};

/**
 * The pattern of each line style, in units of the line width: the length of a
 * dash and of the gap after it, and so on. A dash of length 0 is a dot, which
 * is round because the ends of the line are.
 */
const LINE_STYLES: Record<
  Exclude<LineStyle, "solid">,
  { pattern: number[]; cap: "butt" | "round" }
> = {
  dashed: { pattern: [3, 2], cap: "butt" },
  dotted: { pattern: [0, 2], cap: "round" },
  "dash-dot": { pattern: [2, 3, 0, 3], cap: "round" },
};

/** A line thinner than this has the pattern of this one, so that it is seen */
const MIN_PATTERN_UNIT = 2;

/**
 * The options of a canvas object (or brush) which draw a line in a style.
 * They are none for a solid line, and for a style which is not known, so the
 * object keeps what it has.
 *
 * @param style the style of the line
 * @param width the width of the line
 */
export const lineStroke = (
  style: LineStyle | undefined,
  width: number
): { strokeDashArray?: number[]; strokeLineCap?: "butt" | "round" } => {
  const found = style && style !== "solid" ? LINE_STYLES[style] : undefined;
  if (!found) return {};
  const unit = Math.max(width, MIN_PATTERN_UNIT);
  return {
    strokeDashArray: found.pattern.map((length) => length * unit),
    strokeLineCap: found.cap,
  };
};

/**
 * Convert a hex color code to its rgba equivalent (with 0.4 alpha)
 *
 * @param hex is a color code in the form of #rgb or #rrggbb
 * @returns {string}
 * @throws Error when the given value is not a valid hex color code
 */
export const hexToRgbA = (hex: string): string => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    throw new Error(`Bad hex color: "${hex}"`);
  }
  let digits = hex.substring(1).split("");
  if (digits.length === 3) {
    digits = [digits[0], digits[0], digits[1], digits[1], digits[2], digits[2]];
  }
  const value = parseInt(digits.join(""), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return `rgba(${r},${g},${b},0.4)`;
};

const COLORS: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgrey: "#d3d3d3",
  lightgreen: "#90ee90",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

/**
 * Convert a CSS color name to its hex equivalent
 *
 * @param color is a color name (case insensitive)
 * @returns the hex code, or undefined when the name is unknown
 */
export const colorNameToHex = (color: string): string | undefined => {
  const name = color.toLowerCase();
  return Object.prototype.hasOwnProperty.call(COLORS, name)
    ? COLORS[name]
    : undefined;
};
