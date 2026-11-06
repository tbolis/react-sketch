import type { Region } from "./flood";

export interface Point {
  x: number;
  y: number;
}

/** The directions of an edge between two pixel corners, clockwise: right, down, left, up */
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

/**
 * Trace the outline of an area: one closed loop for its outer edge, and one
 * for the edge of each hole in it. The points are the corners of the pixels,
 * so a pixel at (x, y) is the square from (x, y) to (x + 1, y + 1).
 *
 * The loops of the outer edges run clockwise (on a screen, where y goes down)
 * and the ones of the holes counterclockwise. Pixels which touch at a corner
 * only are separate loops, so a fill does not have a pinch where they meet.
 */
export const traceOutline = (region: Region): Point[][] => {
  const { mask, width, height, left, top, right, bottom } = region;
  const stride = width + 1;
  const filled = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;

  // The edges between a pixel of the area and one which is not, with the area
  // on the right of the way they go, indexed by the corner they start from
  const startX: number[] = [];
  const startY: number[] = [];
  const direction: number[] = [];
  const from = new Map<number, number[]>();
  const edge = (x: number, y: number, way: number): void => {
    const key = y * stride + x;
    const list = from.get(key);
    if (list) list.push(startX.length);
    else from.set(key, [startX.length]);
    startX.push(x);
    startY.push(y);
    direction.push(way);
  };
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (!filled(x, y)) continue;
      if (!filled(x, y - 1)) edge(x, y, 0);
      if (!filled(x + 1, y)) edge(x + 1, y, 1);
      if (!filled(x, y + 1)) edge(x + 1, y + 1, 2);
      if (!filled(x - 1, y)) edge(x, y + 1, 3);
    }
  }

  // Follow the edges, from one to the next, until they are back where they
  // started. Where two edges leave a corner, the one which turns right keeps
  // to the pixel the loop is around, so the loops stay apart.
  const used = new Uint8Array(startX.length);
  const loops: Point[][] = [];
  for (let first = 0; first < startX.length; first++) {
    if (used[first]) continue;
    const loop: Point[] = [];
    let previous = -1;
    let current = first;
    while (current !== -1) {
      used[current] = 1;
      // Only the corners where the way changes are points of the loop
      if (previous === -1 || direction[previous] !== direction[current]) {
        loop.push({ x: startX[current], y: startY[current] });
      }
      const way = direction[current];
      const x = startX[current] + DX[way];
      const y = startY[current] + DY[way];
      const candidates = (from.get(y * stride + x) ?? []).filter((e) => !used[e]);
      previous = current;
      current = -1;
      for (const turn of [1, 0, 3]) {
        const found = candidates.find((e) => direction[e] === (way + turn) % 4);
        if (found !== undefined) {
          current = found;
          break;
        }
      }
    }
    // The first corner is one only if the way changes where the loop closes
    if (loop.length > 1 && direction[previous] === direction[first]) loop.shift();
    loops.push(loop);
  }
  return loops;
};

/** Distance of the point from the line through a and b, and from a when they are the same */
const distance = (point: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  return Math.abs(dx * (a.y - point.y) - (a.x - point.x) * dy) / length;
};

/** Ramer-Douglas-Peucker on a line, which keeps the first and the last point */
const simplifyLine = (points: Point[], tolerance: number): Point[] => {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const ranges: [number, number][] = [[0, points.length - 1]];
  while (ranges.length) {
    const [start, end] = ranges.pop() as [number, number];
    let farthest = -1;
    let most = tolerance;
    for (let i = start + 1; i < end; i++) {
      const away = distance(points[i], points[start], points[end]);
      if (away > most) {
        most = away;
        farthest = i;
      }
    }
    if (farthest !== -1) {
      keep[farthest] = 1;
      ranges.push([start, farthest], [farthest, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
};

/**
 * Take the points of a closed loop which a straight line cannot do without:
 * the ones the loop is further than `tolerance` pixels from the line between
 * the points on both sides of them. The steps of a diagonal or of a curve
 * of pixels become a line.
 *
 * @returns the points, fewer than 3 when the loop is too flat to be one
 */
export const simplify = (loop: Point[], tolerance: number): Point[] => {
  if (tolerance <= 0 || loop.length < 4) return loop;
  // A closed loop has no ends to keep, so it is cut in two where the point
  // is the furthest from the first one
  let far = 0;
  let most = -1;
  loop.forEach((point, i) => {
    const away = Math.hypot(point.x - loop[0].x, point.y - loop[0].y);
    if (away > most) {
      most = away;
      far = i;
    }
  });
  const one = simplifyLine(loop.slice(0, far + 1), tolerance);
  const other = simplifyLine([...loop.slice(far), loop[0]], tolerance);
  return [...one.slice(0, -1), ...other.slice(0, -1)];
};

/**
 * The outline of an area as the data of a path, in the coordinates the
 * `place` function gives to the pixel corners. The loops which are too small
 * to have an area are left out.
 *
 * @param simplifyBy see {@link simplify}
 * @param place maps a corner of a pixel to the point it is on the path
 */
export const outlinePath = (
  region: Region,
  simplifyBy: number,
  place: (point: Point) => Point = (point) => point
): string => {
  const parts: string[] = [];
  for (const loop of traceOutline(region)) {
    const points = simplify(loop, simplifyBy);
    if (points.length < 3) continue;
    const text = points.map((point) => {
      const { x, y } = place(point);
      return `${round(x)} ${round(y)}`;
    });
    parts.push(`M ${text.join(" L ")} Z`);
  }
  return parts.join(" ");
};

/** Two decimals are enough for a point, and keep the data short */
const round = (value: number): number => Math.round(value * 100) / 100;
