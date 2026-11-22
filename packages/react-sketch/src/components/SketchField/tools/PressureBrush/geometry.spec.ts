/**
 * Real pixels: the canvas is drawn by node-canvas (the node build of fabric), as jsdom
 * with the canvas mock draws nothing the shape of a stroke could be read from.
 *
 * @jest-environment node
 */
import * as fabric from "fabric";
import {
  capsulePath,
  strokePath,
  StrokeSampler,
  widthFactor,
  type Disc,
} from "./geometry";

jest.mock("fabric", () => jest.requireActual("fabric/node"));

/** The alpha of the pixels of the commands, filled in black as the stroke of the brush is */
const draw = (commands: (string | number)[][]) => {
  const canvas = new fabric.Canvas(undefined, { width: 220, height: 160 });
  canvas.add(
    new fabric.Path(commands as fabric.TSimpleParsedCommand[], {
      fill: "#000000",
      stroke: null,
      strokeWidth: 0,
    })
  );
  const element = canvas.toCanvasElement(1);
  const { data, width } = (
    element.getContext("2d") as CanvasRenderingContext2D
  ).getImageData(0, 0, element.width, element.height);
  void canvas.dispose();
  return (x: number, y: number): number =>
    data[(Math.round(y) * width + Math.round(x)) * 4 + 3];
};

const filled = (alpha: number) => alpha > 200;
const empty = (alpha: number) => alpha < 40;

describe("widthFactor", () => {
  it("is 1 at a medium pressure, and stays between a tenth and twice", () => {
    expect(widthFactor(0.5)).toBe(1);
    expect(widthFactor(1)).toBe(2);
    expect(widthFactor(0.25)).toBe(0.5);
    expect(widthFactor(0)).toBe(0.1);
    expect(widthFactor(-1)).toBe(0.1);
    expect(widthFactor(3)).toBe(2);
  });
});

describe("capsulePath", () => {
  it("fills two discs of one width, and what is between them", () => {
    const at = draw(capsulePath({ x: 50, y: 80, r: 10 }, { x: 150, y: 80, r: 10 }));

    expect(filled(at(100, 80))).toBe(true);
    expect(filled(at(100, 71))).toBe(true);
    expect(filled(at(100, 89))).toBe(true);
    expect(empty(at(100, 68))).toBe(true);
    expect(empty(at(100, 92))).toBe(true);
    // The round ends
    expect(filled(at(42, 80))).toBe(true);
    expect(empty(at(37, 80))).toBe(true);
    expect(filled(at(158, 80))).toBe(true);
    expect(empty(at(163, 80))).toBe(true);
    // The corners of a rectangle are not filled
    expect(empty(at(41, 71))).toBe(true);
  });

  it("is as wide as each disc at its end, and between at the middle", () => {
    const at = draw(capsulePath({ x: 50, y: 80, r: 20 }, { x: 150, y: 80, r: 5 }));

    expect(filled(at(50, 98))).toBe(true);
    expect(empty(at(50, 103))).toBe(true);
    expect(filled(at(150, 83))).toBe(true);
    expect(empty(at(150, 87))).toBe(true);
    // The tangents leave a width of 12 and a half at the middle, less the slant
    expect(filled(at(100, 80 + 10))).toBe(true);
    expect(empty(at(100, 80 + 16))).toBe(true);
  });

  const directions: [string, Disc, Disc][] = [
    [
      "to the right, to a wider one",
      { x: 40, y: 80, r: 6 },
      { x: 170, y: 80, r: 18 },
    ],
    [
      "to the left, to a wider one",
      { x: 170, y: 80, r: 6 },
      { x: 40, y: 80, r: 18 },
    ],
    ["down to the right", { x: 40, y: 30, r: 14 }, { x: 170, y: 130, r: 6 }],
    ["up to the right", { x: 40, y: 130, r: 8 }, { x: 170, y: 30, r: 16 }],
    ["up", { x: 100, y: 140, r: 10 }, { x: 100, y: 20, r: 10 }],
    ["down to a narrower one", { x: 100, y: 40, r: 18 }, { x: 100, y: 140, r: 4 }],
  ];

  it.each(directions)("fills the same way %s", (_name, a, b) => {
    const at = draw(capsulePath(a, b));

    // The line between the centers, and the part of each disc which is not along it
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      expect(filled(at(x, y))).toBe(true);
    }
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    for (const disc of [a, b]) {
      expect(filled(at(disc.x + disc.r * 0.8, disc.y))).toBe(true);
      expect(filled(at(disc.x, disc.y + disc.r * 0.8))).toBe(true);
    }
    // Behind the first disc, and past the last one
    expect(
      empty(at(a.x - Math.cos(angle) * (a.r + 4), a.y - Math.sin(angle) * (a.r + 4)))
    ).toBe(true);
    expect(
      empty(at(b.x + Math.cos(angle) * (b.r + 4), b.y + Math.sin(angle) * (b.r + 4)))
    ).toBe(true);
    // Next to the middle of the line, at the width of the area there
    const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: (a.r + b.r) / 2 };
    const normal = { x: -Math.sin(angle), y: Math.cos(angle) };
    for (const side of [1, -1]) {
      expect(
        filled(
          at(
            middle.x + side * normal.x * middle.r * 0.7,
            middle.y + side * normal.y * middle.r * 0.7
          )
        )
      ).toBe(true);
      expect(
        empty(
          at(
            middle.x + side * normal.x * (middle.r + 5),
            middle.y + side * normal.y * (middle.r + 5)
          )
        )
      ).toBe(true);
    }
  });

  it("is the larger disc when one is in the other", () => {
    const at = draw(capsulePath({ x: 100, y: 80, r: 20 }, { x: 106, y: 80, r: 5 }));

    expect(filled(at(100, 98))).toBe(true);
    expect(empty(at(100, 103))).toBe(true);
    expect(filled(at(118, 80))).toBe(true);
    expect(empty(at(124, 80))).toBe(true);
  });
});

describe("strokePath", () => {
  it("is one disc for a stroke which is one point", () => {
    const at = draw(strokePath([{ x: 100, y: 80, r: 12 }]));

    expect(filled(at(100, 80))).toBe(true);
    expect(filled(at(100, 90))).toBe(true);
    expect(empty(at(100, 95))).toBe(true);
  });

  it("has no hole where the pieces overlap, at a sharp turn of a wide stroke", () => {
    // A corner: right, then down, with a width larger than the distance the turn is made in
    const discs: Disc[] = [
      { x: 40, y: 40, r: 14 },
      { x: 90, y: 40, r: 14 },
      { x: 100, y: 46, r: 14 },
      { x: 104, y: 56, r: 14 },
      { x: 104, y: 110, r: 14 },
    ];
    const at = draw(strokePath(discs));

    for (let x = 30; x <= 100; x += 5) expect(filled(at(x, 40))).toBe(true);
    for (let y = 40; y <= 110; y += 5) {
      expect(filled(at(104, y))).toBe(true);
    }
    // Across the overlapping pieces
    for (let x = 80; x <= 112; x += 4) expect(filled(at(x, 50))).toBe(true);
    expect(empty(at(60, 70))).toBe(true);
    expect(empty(at(130, 80))).toBe(true);
  });

  it("is a disc when the discs do not leave their place", () => {
    const at = draw(
      strokePath([
        { x: 100, y: 80, r: 10 },
        { x: 100.05, y: 80, r: 10 },
      ])
    );

    expect(filled(at(100, 80))).toBe(true);
    expect(empty(at(100, 94))).toBe(true);
  });
});

describe("StrokeSampler", () => {
  it("starts with the disc of the first point, as wide as its pressure says", () => {
    const sampler = new StrokeSampler(20);

    sampler.add(10, 10, 1);

    expect(sampler.discs).toEqual([{ x: 10, y: 10, r: 20 }]);
  });

  it("follows the pressure along the stroke", () => {
    const sampler = new StrokeSampler(20);

    for (let i = 0; i <= 40; i++) sampler.add(10 + i * 5, 50, 0.1 + (0.8 * i) / 40);
    sampler.finish();

    const radii = sampler.discs.map((disc) => disc.r);
    expect(radii[0]).toBeCloseTo(2, 1);
    expect(radii[radii.length - 1]).toBeGreaterThan(15);
    // It only gets wider
    radii
      .slice(1)
      .forEach((r, i) => expect(r).toBeGreaterThanOrEqual(radii[i] - 1e-9));
  });

  it("ends at the last point, with the width of the pressure on it", () => {
    const sampler = new StrokeSampler(10);

    sampler.add(0, 0, 0.5);
    sampler.add(30, 0, 0.5);
    sampler.add(60, 20, 0.5);
    sampler.finish();

    const last = sampler.discs[sampler.discs.length - 1];
    expect(last.x).toBeCloseTo(60, 6);
    expect(last.y).toBeCloseTo(20, 6);
    expect(last.r).toBeCloseTo(5, 6);
  });

  it("does not follow the noise of one reading of the pen", () => {
    const sampler = new StrokeSampler(20);
    sampler.add(0, 0, 0.5);

    sampler.add(5, 0, 1);

    // Half of the way between the two pressures, and not at the new one
    expect(sampler.discs[sampler.discs.length - 1].r).toBeLessThan(
      (20 / 2) * widthFactor(0.9)
    );
  });

  it("makes a smooth line: the discs are a few pixels apart, also where the line turns", () => {
    const sampler = new StrokeSampler(8);

    [
      [0, 0],
      [40, 0],
      [80, 40],
      [80, 90],
    ].forEach(([x, y]) => sampler.add(x, y, 0.5));
    sampler.finish();

    const { discs } = sampler;
    discs.slice(1).forEach((disc, i) => {
      expect(
        Math.hypot(disc.x - discs[i].x, disc.y - discs[i].y)
      ).toBeLessThanOrEqual(6);
    });
  });
});
