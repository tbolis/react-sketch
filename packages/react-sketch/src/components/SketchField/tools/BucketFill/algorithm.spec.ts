import {
  floodFill,
  grow,
  outlinePath,
  simplify,
  traceOutline,
  type Pixels,
  type Point,
  type Region,
} from "@react-sketch/bucket";

type Color = [number, number, number, number];

const CLEAR: Color = [0, 0, 0, 0];
const BLACK: Color = [0, 0, 0, 255];

/** An image of the given size, each pixel painted by `paint` (transparent where it gives nothing) */
const image = (
  width: number,
  height: number,
  paint: (x: number, y: number) => Color | undefined
): Pixels => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set(paint(x, y) ?? CLEAR, (y * width + x) * 4);
    }
  }
  return { data, width, height };
};

/** The outline of a rectangle of the given thickness, which has its first pixel at (left, top) */
const outline =
  (left: number, top: number, right: number, bottom: number, thickness = 1) =>
  (x: number, y: number): Color | undefined => {
    const inside = x >= left && x <= right && y >= top && y <= bottom;
    const hollow =
      x >= left + thickness &&
      x <= right - thickness &&
      y >= top + thickness &&
      y <= bottom - thickness;
    return inside && !hollow ? BLACK : undefined;
  };

/** A region made of the pixels of a picture drawn with "#" */
const regionOf = (...rows: string[]): Region => {
  const height = rows.length;
  const width = rows[0].length;
  const mask = new Uint8Array(width * height);
  let area = 0;
  rows.forEach((row, y) =>
    [...row].forEach((char, x) => {
      if (char === "#") {
        mask[y * width + x] = 1;
        area++;
      }
    })
  );
  return {
    mask,
    width,
    height,
    left: 0,
    top: 0,
    right: width - 1,
    bottom: height - 1,
    area,
    open: false,
  };
};

/** Twice the area the loop encloses, positive for the loops which run clockwise on a screen */
const signedArea = (loop: Point[]): number =>
  loop.reduce((sum, a, i) => {
    const b = loop[(i + 1) % loop.length];
    return sum + (a.x * b.y - b.x * a.y);
  }, 0) / 2;

describe("floodFill", () => {
  const box = image(20, 20, outline(4, 4, 15, 15));

  it("finds the area which a rectangle closes, and the line is not in it", () => {
    const region = floodFill(box, 10, 10) as Region;

    expect(region.open).toBe(false);
    expect(region.area).toBe(10 * 10);
    expect([region.left, region.top, region.right, region.bottom]).toEqual([
      5, 5, 14, 14,
    ]);
    expect(region.mask[10 * 20 + 10]).toBe(1);
    expect(region.mask[4 * 20 + 10]).toBe(0);
  });

  it("is open when the area reaches the edge of the image", () => {
    const region = floodFill(box, 1, 1) as Region;

    expect(region.open).toBe(true);
    expect(region.area).toBe(20 * 20 - 12 * 12);
  });

  it("is open when it reaches the edge at one side only", () => {
    // A box which is not closed at the top, where it is at the edge of the image
    const cup = image(10, 10, (x, y) =>
      ((x === 2 || x === 7) && y <= 6) || (y === 6 && x >= 2 && x <= 7)
        ? BLACK
        : undefined
    );

    const region = floodFill(cup, 4, 3) as Region;

    expect(region.area).toBe(4 * 6);
    expect(region.open).toBe(true);
  });

  it("finds nothing outside the image", () => {
    expect(floodFill(box, -1, 5)).toBeNull();
    expect(floodFill(box, 5, 20)).toBeNull();
    expect(floodFill(box, 20, 5)).toBeNull();
  });

  it("takes the pixel which is pressed as it is, so the line itself is an area", () => {
    const region = floodFill(box, 4, 8) as Region;

    expect(region.area).toBe(12 * 12 - 10 * 10);
    expect(region.open).toBe(false);
  });

  it("does not go diagonally through a line of pixels which touch at their corners", () => {
    const diagonal = image(10, 10, (x, y) => (x === y ? BLACK : undefined));

    const region = floodFill(diagonal, 7, 2) as Region;

    expect(region.mask[2 * 10 + 7]).toBe(1);
    expect(region.mask[7 * 10 + 2]).toBe(0);
  });

  describe("tolerance", () => {
    const faint = (alpha: number) =>
      image(3, 1, (x) => (x === 1 ? [255, 0, 0, alpha] : undefined));

    it("joins the pixels which differ less than the tolerance, and no others", () => {
      expect((floodFill(faint(30), 0, 0, 32) as Region).area).toBe(3);
      expect((floodFill(faint(33), 0, 0, 32) as Region).area).toBe(1);
    });

    it("does not join colors which differ at all with none", () => {
      expect((floodFill(faint(1), 0, 0, 0) as Region).area).toBe(1);
      expect((floodFill(faint(0), 0, 0, 0) as Region).area).toBe(3);
    });

    it("applies the alpha before it compares, so a faint pixel is as near to a transparent one whatever its color", () => {
      const red = image(2, 1, (x) => (x === 1 ? [255, 0, 0, 20] : undefined));
      const black = image(2, 1, (x) => (x === 1 ? [0, 0, 0, 20] : undefined));

      expect((floodFill(red, 0, 0, 32) as Region).area).toBe(2);
      expect((floodFill(black, 0, 0, 32) as Region).area).toBe(2);
    });

    it("compares each channel", () => {
      const colors = image(2, 1, (x) =>
        x === 1 ? [0, 0, 100, 255] : [0, 0, 60, 255]
      );

      expect((floodFill(colors, 0, 0, 39) as Region).area).toBe(1);
      expect((floodFill(colors, 0, 0, 40) as Region).area).toBe(2);
    });
  });
});

describe("grow", () => {
  const box = image(20, 20, outline(4, 4, 15, 15, 3));
  const region = floodFill(box, 10, 10) as Region;

  it("goes under the line, as far as the radius, and no further", () => {
    // The line is 3 pixels thick, so the area of 6 by 6 has 2 pixels of it around
    expect(region.area).toBe(6 * 6);

    const grown = grow(region, box, 2);

    expect([grown.left, grown.top, grown.right, grown.bottom]).toEqual([
      5, 5, 14, 14,
    ]);
    expect(grown.area).toBe(10 * 10);
    expect(grown.mask[4 * 20 + 10]).toBe(0);
    expect(grown.mask[5 * 20 + 10]).toBe(1);
  });

  it("does not leave the line, where nothing is drawn over the fill", () => {
    const thin = image(20, 20, outline(4, 4, 15, 15));
    const inner = floodFill(thin, 10, 10) as Region;

    const grown = grow(inner, thin, 3);

    // The line is one pixel thick: the fill goes under it, and not out of it
    expect(grown.left).toBe(4);
    expect(grown.right).toBe(15);
    expect(grown.area).toBe(12 * 12);
  });

  it("does not grow over a pixel with nothing drawn on it", () => {
    const none = image(20, 20, () => undefined);

    expect(grow(region, none, 2).area).toBe(region.area);
  });

  it("is the region itself with a radius of 0", () => {
    expect(grow(region, box, 0)).toBe(region);
  });

  it("does not change the region it is given", () => {
    const before = region.area;
    grow(region, box, 2);

    expect(region.area).toBe(before);
    expect(region.mask[4 * 20 + 10]).toBe(0);
  });

  it("stays in the image", () => {
    const covered = image(10, 10, () => BLACK);
    const corner = regionOf("#.........", ...Array(9).fill(".........."));

    const grown = grow(corner, covered, 3);

    expect([grown.left, grown.top, grown.right, grown.bottom]).toEqual([0, 0, 3, 3]);
    expect(grown.area).toBe(4 * 4);
  });
});

describe("traceOutline", () => {
  it("is one loop with a point at each corner for a rectangle", () => {
    const loops = traceOutline(regionOf("....", ".###", ".###", "...."));

    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
    expect(loops[0]).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1 },
        { x: 4, y: 1 },
        { x: 4, y: 3 },
        { x: 1, y: 3 },
      ])
    );
  });

  it("runs clockwise on a screen around an area", () => {
    const [loop] = traceOutline(regionOf("##", "##"));

    expect(signedArea(loop)).toBe(4);
  });

  it("has the six corners of an L", () => {
    const loops = traceOutline(regionOf("#.", "#.", "##"));

    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(6);
    expect(signedArea(loops[0])).toBe(4);
  });

  it("has a loop for the edge of a hole, which runs the other way", () => {
    const loops = traceOutline(
      regionOf("#####", "#...#", "#...#", "#...#", "#####")
    );

    expect(loops).toHaveLength(2);
    const areas = loops.map(signedArea).sort((a, b) => a - b);
    expect(areas).toEqual([-9, 25]);
  });

  it("has a loop for each separate area", () => {
    const loops = traceOutline(regionOf("##..##", "##..##"));

    expect(loops).toHaveLength(2);
    expect(loops.map(signedArea)).toEqual([4, 4]);
  });

  it("keeps pixels which touch at a corner apart, there is no pinch", () => {
    const loops = traceOutline(regionOf("#.", ".#"));

    expect(loops).toHaveLength(2);
    loops.forEach((loop) => {
      expect(loop).toHaveLength(4);
      expect(signedArea(loop)).toBe(1);
    });
  });

  it("has the area of the region in all its loops", () => {
    const region = regionOf(
      ".#####.",
      "##...##",
      "#..#..#",
      "#.###.#",
      "##...##",
      ".#####."
    );

    const total = traceOutline(region)
      .map(signedArea)
      .reduce((sum, area) => sum + area, 0);

    expect(total).toBe(region.area);
  });

  it("has no loop for an empty region", () => {
    expect(traceOutline(regionOf("..", ".."))).toEqual([]);
  });
});

describe("simplify", () => {
  const staircase = (steps: number): Point[] => {
    const loop: Point[] = [{ x: 0, y: 0 }];
    for (let i = 0; i < steps; i++) {
      loop.push({ x: i + 1, y: i }, { x: i + 1, y: i + 1 });
    }
    loop.push({ x: 0, y: steps });
    return loop;
  };

  it("turns the steps of a diagonal into a line", () => {
    const simple = simplify(staircase(40), 1);

    expect(simple.length).toBeLessThan(8);
    expect(simple).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0 },
        { x: 0, y: 40 },
      ])
    );
  });

  it("keeps a corner", () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    expect(simplify(square, 0.5)).toHaveLength(4);
  });

  it("leaves the loop as it is without a tolerance", () => {
    const loop = staircase(10);

    expect(simplify(loop, 0)).toBe(loop);
  });

  it("leaves a loop of three points or fewer", () => {
    const triangle: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 5 },
    ];

    expect(simplify(triangle, 1)).toBe(triangle);
  });

  it("keeps a bump which is higher than the tolerance, and drops one which is not", () => {
    const bump = (height: number): Point[] => [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: height },
      { x: 15, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];

    expect(simplify(bump(3), 1).some((p) => p.y === 3)).toBe(true);
    expect(simplify(bump(0.4), 1).some((p) => p.y === 0.4)).toBe(false);
  });
});

describe("outlinePath", () => {
  it("is the data of a path, a loop after another", () => {
    const region = regionOf("#####", "#...#", "#####");

    const data = outlinePath(region, 0);

    expect(data.match(/M/g)).toHaveLength(2);
    expect(data.match(/Z/g)).toHaveLength(2);
    expect(data).toMatch(/^M [\d. L-]+ Z M [\d. L-]+ Z$/);
  });

  it("puts the points where the function says", () => {
    const data = outlinePath(regionOf("##", "##"), 0, ({ x, y }) => ({
      x: x * 2 + 10,
      y: y * 2 + 20,
    }));

    expect(data).toBe("M 10 20 L 14 20 L 14 24 L 10 24 Z");
  });

  it("rounds the points to two decimals", () => {
    const data = outlinePath(regionOf("##", "##"), 0, ({ x, y }) => ({
      x: x / 3,
      y: y / 3,
    }));

    expect(data).toContain("0.67 0.67");
  });

  it("leaves out a loop which is too thin to have an area once it is simplified", () => {
    const strip = regionOf("####################");

    expect(outlinePath(strip, 0)).not.toBe("");
    expect(outlinePath(strip, 2)).toBe("");
  });

  it("is empty for an empty region", () => {
    expect(outlinePath(regionOf("..", ".."), 0.5)).toBe("");
  });
});
