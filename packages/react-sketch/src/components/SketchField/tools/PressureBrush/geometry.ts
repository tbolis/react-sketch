/**
 * The shape of a stroke whose width follows the pressure of a pen: a line of discs, each
 * as wide as the pen pressed at that point, and the area which joins one disc to the next.
 * Every piece is drawn the same way round, so that the union of them is filled, with no
 * hole where they overlap.
 */

export interface Disc {
  x: number;
  y: number;
  r: number;
}

type Command = (string | number)[];

/** The narrowest and the widest a stroke gets, as a part of `lineWidth`. A pressure of 0.5 gives 1 */
const MIN_FACTOR = 0.1;
const MAX_FACTOR = 2;

/** How much of the new pressure is taken in, so that the noise of the pen does not make the width jump */
const SMOOTHING = 0.5;

/** The distance between the discs of a curve, and the most discs of one piece of it */
const SPACING = 3;
const MAX_STEPS = 64;

/** The width of the stroke as a part of `lineWidth`, for a pressure from 0 to 1 */
export const widthFactor = (pressure: number): number =>
  Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, 2 * pressure));

const round = (value: number): number => Math.round(value * 100) / 100;

const pointOn = ({ x, y, r }: Disc, angle: number): [number, number] => [
  x + r * Math.cos(angle),
  y + r * Math.sin(angle),
];

/**
 * Where the two common tangents of the discs touch them: the angle of the line between
 * their centers, and how far from it the tangents are. None when one disc is in the other.
 */
const tangents = (
  a: Disc,
  b: Disc
): { angle: number; spread: number } | undefined => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= Math.abs(a.r - b.r)) return undefined;
  return { angle: Math.atan2(dy, dx), spread: Math.acos((a.r - b.r) / distance) };
};

/** The disc which is the area of two when one is in the other */
const larger = (a: Disc, b: Disc): Disc => (a.r >= b.r ? a : b);

/**
 * The two discs and the area which joins them, as the commands of an SVG path. The arcs
 * turn from the larger angle to the smaller, as the circle does.
 */
export const capsulePath = (a: Disc, b: Disc): Command[] => {
  const common = tangents(a, b);
  if (!common) {
    const { x, y, r } = larger(a, b);
    return [
      ["M", round(x - r), round(y)],
      ["A", round(r), round(r), 0, 0, 0, round(x + r), round(y)],
      ["A", round(r), round(r), 0, 0, 0, round(x - r), round(y)],
      ["Z"],
    ];
  }
  const { angle, spread } = common;
  const [ax1, ay1] = pointOn(a, angle + spread);
  const [bx1, by1] = pointOn(b, angle + spread);
  const [bx2, by2] = pointOn(b, angle - spread);
  const [ax2, ay2] = pointOn(a, angle - spread);
  // The cap at the far end is 2 * spread wide, and the one at the near end the rest of the turn
  const farLarge = spread > Math.PI / 2 ? 1 : 0;
  const nearLarge = spread < Math.PI / 2 ? 1 : 0;
  return [
    ["M", round(ax1), round(ay1)],
    ["L", round(bx1), round(by1)],
    ["A", round(b.r), round(b.r), 0, farLarge, 0, round(bx2), round(by2)],
    ["L", round(ax2), round(ay2)],
    ["A", round(a.r), round(a.r), 0, nearLarge, 0, round(ax1), round(ay1)],
    ["Z"],
  ];
};

/** The same as {@link capsulePath}, added to the path of a canvas context */
export const addCapsule = (ctx: CanvasPath, a: Disc, b: Disc): void => {
  const common = tangents(a, b);
  if (!common) {
    const { x, y, r } = larger(a, b);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 2 * Math.PI, 0, true);
    ctx.closePath();
    return;
  }
  const { angle, spread } = common;
  const [ax1, ay1] = pointOn(a, angle + spread);
  const [bx1, by1] = pointOn(b, angle + spread);
  const [ax2, ay2] = pointOn(a, angle - spread);
  ctx.moveTo(ax1, ay1);
  ctx.lineTo(bx1, by1);
  ctx.arc(b.x, b.y, b.r, angle + spread, angle - spread, true);
  ctx.lineTo(ax2, ay2);
  ctx.arc(a.x, a.y, a.r, angle - spread, angle + spread, true);
  ctx.closePath();
};

/** Whether the second disc adds nothing to the first, as it is at the same place and as wide */
const same = (a: Disc, b: Disc): boolean =>
  Math.hypot(b.x - a.x, b.y - a.y) < 0.25 && Math.abs(b.r - a.r) < 0.25;

/** The commands of the path of a whole stroke: its discs, and the area between each two */
export const strokePath = (discs: Disc[]): Command[] => {
  if (discs.length === 1) return capsulePath(discs[0], discs[0]);
  const commands: Command[] = [];
  for (let i = 1; i < discs.length; i++) {
    if (!same(discs[i - 1], discs[i]))
      commands.push(...capsulePath(discs[i - 1], discs[i]));
  }
  // Every disc was the same as the one before it: the stroke did not leave its place
  return commands.length ? commands : capsulePath(discs[0], discs[0]);
};

const midpoint = (a: Disc, b: Disc): Disc => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  r: (a.r + b.r) / 2,
});

/**
 * The discs along the curve from `start` to `end` which bends towards `control`, not
 * counting `start`: the width goes from the one of `start` to the one of `end`
 */
const along = (start: Disc, control: Disc, end: Disc): Disc[] => {
  const length =
    Math.hypot(control.x - start.x, control.y - start.y) +
    Math.hypot(end.x - control.x, end.y - control.y);
  const steps = Math.min(MAX_STEPS, Math.max(1, Math.ceil(length / SPACING)));
  const discs: Disc[] = [];
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const u = 1 - t;
    discs.push({
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
      r: start.r + (end.r - start.r) * t,
    });
  }
  return discs;
};

/**
 * Turns the points of a stroke, with the pressure at each, into the discs along its
 * smooth line. The line is the one the brush of fabric draws: it goes through the middle
 * of each two points, bending towards the point between them. It is made as the points
 * come, so what is drawn while the pen moves is what the stroke is when it is lifted.
 */
export class StrokeSampler {
  /** The discs along the line, from its start to the middle of the last two points */
  readonly discs: Disc[] = [];
  private readonly points: Disc[] = [];
  private pressure?: number;

  /** @param width the width of the stroke at a pressure of 0.5 */
  constructor(private readonly width: number) {}

  /** The last point which was added */
  get last(): Disc | undefined {
    return this.points[this.points.length - 1];
  }

  /** Add a point of the stroke */
  add(x: number, y: number, pressure: number): void {
    this.pressure =
      this.pressure === undefined
        ? pressure
        : this.pressure + SMOOTHING * (pressure - this.pressure);
    const point = { x, y, r: (this.width / 2) * widthFactor(this.pressure) };
    this.points.push(point);
    const i = this.points.length - 1;
    if (i === 0) {
      this.discs.push(point);
      return;
    }
    const previous = this.points[i - 1];
    const start = i === 1 ? previous : midpoint(this.points[i - 2], previous);
    this.discs.push(...along(start, previous, midpoint(previous, point)));
  }

  /** End the stroke: the line goes on to the last point */
  finish(): void {
    const n = this.points.length;
    if (n < 2) return;
    const start = midpoint(this.points[n - 2], this.points[n - 1]);
    this.discs.push(...along(start, start, this.points[n - 1]));
  }
}
