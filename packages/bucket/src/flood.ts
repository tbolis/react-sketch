/**
 * The pixels of an image, as `getImageData` of a canvas returns them: four
 * bytes (red, green, blue, alpha) for each pixel, row by row
 */
export interface Pixels {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

/**
 * An area of an image
 */
export interface Region {
  /** 1 for the pixels of the area and 0 for the others, row by row */
  mask: Uint8Array;
  width: number;
  height: number;
  /** The bounds of the area, the first and the last pixel it has in a row and in a column */
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** The number of pixels of the area */
  area: number;
  /**
   * Whether the area reaches the edge of the image. Then it is not known to
   * be closed, as what closes it can be out of the image.
   */
  open: boolean;
}

/** How different a pixel can be from the one pressed, and be of the same area */
export const DEFAULT_TOLERANCE = 32;

/**
 * Find the area of the pixels which are of the same color as the pixel at
 * (x, y), and are connected to it, left, right, up or down.
 *
 * Colors are compared with their alpha applied, so a faint pixel of a red
 * line is as close to a transparent pixel as a faint pixel of a black one.
 * Two colors are of the same area when none of their four channels is further
 * apart than the tolerance (0 to 255).
 *
 * @returns the area, or null when the point is out of the image
 */
export const floodFill = (
  { data, width, height }: Pixels,
  x: number,
  y: number,
  tolerance: number = DEFAULT_TOLERANCE
): Region | null => {
  x = Math.floor(x);
  y = Math.floor(y);
  if (!(x >= 0 && y >= 0 && x < width && y < height)) return null;

  const seed = (y * width + x) * 4;
  const seedAlpha = data[seed + 3];
  const seedRed = (data[seed] * seedAlpha) / 255;
  const seedGreen = (data[seed + 1] * seedAlpha) / 255;
  const seedBlue = (data[seed + 2] * seedAlpha) / 255;

  /** Whether the pixel (its index in the image) has the color of the area */
  const similar = (pixel: number): boolean => {
    const at = pixel * 4;
    const alpha = data[at + 3];
    return (
      Math.abs(alpha - seedAlpha) <= tolerance &&
      Math.abs((data[at] * alpha) / 255 - seedRed) <= tolerance &&
      Math.abs((data[at + 1] * alpha) / 255 - seedGreen) <= tolerance &&
      Math.abs((data[at + 2] * alpha) / 255 - seedBlue) <= tolerance
    );
  };

  const mask = new Uint8Array(width * height);
  const region: Region = {
    mask,
    width,
    height,
    left: x,
    top: y,
    right: x,
    bottom: y,
    area: 0,
    open: false,
  };

  // Fills a run of pixels of a row at once, then looks for the runs above and
  // below it which are not filled yet
  const stack = [x, y];
  while (stack.length) {
    const row = stack.pop() as number;
    const column = stack.pop() as number;
    const start = row * width;
    if (mask[start + column] || !similar(start + column)) continue;

    let first = column;
    while (first > 0 && !mask[start + first - 1] && similar(start + first - 1)) {
      first--;
    }
    let last = column;
    while (
      last < width - 1 &&
      !mask[start + last + 1] &&
      similar(start + last + 1)
    ) {
      last++;
    }
    mask.fill(1, start + first, start + last + 1);

    region.area += last - first + 1;
    region.left = Math.min(region.left, first);
    region.right = Math.max(region.right, last);
    region.top = Math.min(region.top, row);
    region.bottom = Math.max(region.bottom, row);
    if (first === 0 || last === width - 1 || row === 0 || row === height - 1) {
      region.open = true;
    }

    for (const next of [row - 1, row + 1]) {
      if (next < 0 || next >= height) continue;
      const nextStart = next * width;
      let inRun = false;
      for (let i = first; i <= last; i++) {
        const open = !mask[nextStart + i] && similar(nextStart + i);
        if (open && !inRun) stack.push(i, next);
        inRun = open;
      }
    }
  }

  return region;
};

/**
 * Grow an area by `radius` pixels in every direction, over the pixels which
 * are painted in `cover` (the ones with some alpha), and no further.
 *
 * It is how a fill goes under the lines around it: the edge of a line is
 * smooth, its pixels are neither the color of the line nor the one of the area,
 * so an area which stops at them leaves a thin seam. Grown under the lines it
 * does not, and it does not spread to where nothing is drawn over it either.
 */
export const grow = (region: Region, cover: Pixels, radius: number): Region => {
  if (radius <= 0) return region;
  const { mask, width, height } = region;
  const left = Math.max(region.left - radius, 0);
  const top = Math.max(region.top - radius, 0);
  const right = Math.min(region.right + radius, width - 1);
  const bottom = Math.min(region.bottom + radius, height - 1);

  // The pixels at most `radius` away in a row, then in a column: the pixels
  // at most `radius` away in both
  const rows = new Uint8Array(width * height);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const from = Math.max(x - radius, 0);
      const to = Math.min(x + radius, width - 1);
      for (let i = from; i <= to; i++) {
        if (mask[y * width + i]) {
          rows[y * width + x] = 1;
          break;
        }
      }
    }
  }

  const grown = mask.slice();
  const bounds = { ...region, mask: grown, area: 0 };
  let first = true;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const pixel = y * width + x;
      if (!grown[pixel]) {
        const from = Math.max(y - radius, 0);
        const to = Math.min(y + radius, height - 1);
        let reached = false;
        for (let j = from; j <= to && !reached; j++) {
          reached = rows[j * width + x] === 1;
        }
        // Only where something is drawn over the fill
        if (reached && cover.data[pixel * 4 + 3] > 0) grown[pixel] = 1;
      }
      if (grown[pixel]) {
        bounds.area++;
        if (first) {
          bounds.left = bounds.right = x;
          bounds.top = bounds.bottom = y;
          first = false;
        } else {
          bounds.left = Math.min(bounds.left, x);
          bounds.right = Math.max(bounds.right, x);
          bounds.top = Math.min(bounds.top, y);
          bounds.bottom = Math.max(bounds.bottom, y);
        }
      }
    }
  }
  return bounds;
};
