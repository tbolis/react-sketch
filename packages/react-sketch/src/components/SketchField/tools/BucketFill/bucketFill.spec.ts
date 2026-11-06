/**
 * Real pixels: the canvas is drawn by node-canvas (the node build of fabric),
 * as jsdom with the canvas mock draws nothing a fill could be found in.
 *
 * @jest-environment node
 */
import * as fabric from "fabric";
import { bucketFill, FillPath, type BucketFillResult } from "@react-sketch/bucket";

jest.mock("fabric", () => jest.requireActual("fabric/node"));

type Color = [number, number, number, number];

const BLUE: Color = [0, 0, 255, 255];
const RED: Color = [255, 0, 0, 255];
const GREEN: Color = [0, 255, 0, 255];
const BLACK: Color = [0, 0, 0, 255];

const FROZEN = { selectable: false, evented: false };

/** A rectangle of the outline of the given line, from its top left corner as the rectangle tool draws it */
const rectangle = (
  left: number,
  top: number,
  width: number,
  height: number,
  options: Partial<fabric.RectProps> = {}
) =>
  new fabric.Rect({
    originX: "left",
    originY: "top",
    left,
    top,
    width,
    height,
    fill: "transparent",
    stroke: "black",
    strokeWidth: 4,
    strokeUniform: true,
    ...FROZEN,
    ...options,
  });

const line = (x1: number, y1: number, x2: number, y2: number, strokeWidth = 4) =>
  new fabric.Line([x1, y1, x2, y2], { stroke: "black", strokeWidth, ...FROZEN });

/** The pixels as the sketch shows them: what is drawn, the fills too */
const shown = (canvas: fabric.Canvas) => {
  const element = canvas.toCanvasElement(1);
  const { data, width } = (
    element.getContext("2d") as CanvasRenderingContext2D
  ).getImageData(0, 0, element.width, element.height);
  return (x: number, y: number): Color => {
    const at = (y * width + x) * 4;
    return [data[at], data[at + 1], data[at + 2], data[at + 3]];
  };
};

/** Whether the colors are the same, a little anti-aliasing aside */
const is = (actual: Color, expected: Color, margin = 3): boolean =>
  actual.every((channel, i) => Math.abs(channel - expected[i]) <= margin);

/** Fill the area around the point and put the fill on the canvas, as the tool does */
const fill = (
  canvas: fabric.Canvas,
  x: number,
  y: number,
  color: string
): BucketFillResult => {
  const result = bucketFill(canvas, { x, y }, { color }) as BucketFillResult;
  expect(result).not.toBeNull();
  canvas.insertAt(result.index, result.fill);
  return result;
};

/** Expect the color, a little anti-aliasing aside: the actual color is in the failure otherwise */
const expectColor = (actual: Color, expected: Color) =>
  expect(is(actual, expected) ? expected : actual).toEqual(expected);

describe("bucketFill", () => {
  let canvas: fabric.Canvas;

  /** Use a canvas of another size, instead of the one of the test */
  const replaceCanvas = (width: number, height: number) => {
    void canvas.dispose();
    canvas = new fabric.Canvas(undefined, { width, height });
  };

  beforeEach(() => {
    canvas = new fabric.Canvas(undefined, { width: 400, height: 300 });
  });

  afterEach(() => {
    void canvas.dispose();
  });

  describe("a rectangle", () => {
    beforeEach(() => {
      canvas.add(rectangle(50, 50, 200, 150));
    });

    it("fills the inside, up to the line, which stays on top", () => {
      fill(canvas, 150, 120, "#0000ff");

      const at = shown(canvas);
      expectColor(at(150, 120), BLUE);
      // Next to the line, there is no seam of the empty canvas
      expectColor(at(150, 58), BLUE);
      expectColor(at(58, 120), BLUE);
      expectColor(at(150, 50), BLACK);
      expectColor(at(50, 120), BLACK);
    });

    it("does not fill out of the line", () => {
      fill(canvas, 150, 120, "#0000ff");

      const at = shown(canvas);
      expect(at(46, 120)[3]).toBe(0);
      expect(at(256, 120)[3]).toBe(0);
      expect(at(150, 46)[3]).toBe(0);
      expect(at(20, 20)[3]).toBe(0);
    });

    it("makes a fill which is a path of its own type, under the rectangle", () => {
      const { fill: path, index } = fill(canvas, 150, 120, "#0000ff");

      expect(path).toBeInstanceOf(FillPath);
      expect(path.fill).toBe("#0000ff");
      expect(path.stroke).toBeNull();
      expect(index).toBe(0);
      expect(canvas.getObjects()[1]).toBeInstanceOf(fabric.Rect);
    });

    it("has the outline of the inside, which is a few points", () => {
      const { fill: path } = fill(canvas, 150, 120, "#0000ff");

      const { left, top, width, height } = path.getBoundingRect();
      // The inside of the line, and one pixel of the line itself
      expect(left).toBeCloseTo(53, 0);
      expect(top).toBeCloseTo(53, 0);
      expect(width).toBeCloseTo(198, 0);
      expect(height).toBeCloseTo(148, 0);
      expect(path.path).toHaveLength(5);
    });

    it("is not closed outside of it, where the area reaches the edge of the canvas", () => {
      expect(bucketFill(canvas, { x: 10, y: 10 }, { color: "red" })).toBeNull();
    });

    it("fills the line when it is the one pressed, which is the area of its color", () => {
      fill(canvas, 150, 52, "#ff0000");

      const at = shown(canvas);
      expectColor(at(150, 52), RED);
      expect(at(150, 120)[3]).toBe(0);
    });
  });

  it("is not closed on an empty canvas", () => {
    expect(bucketFill(canvas, { x: 100, y: 100 }, { color: "red" })).toBeNull();
  });

  it("fills with a color which is not transparent only", () => {
    canvas.add(rectangle(50, 50, 200, 150));

    expect(
      bucketFill(canvas, { x: 150, y: 120 }, { color: "transparent" })
    ).toBeNull();
    expect(
      bucketFill(canvas, { x: 150, y: 120 }, { color: "rgba(0, 0, 0, 0)" })
    ).toBeNull();
    expect(
      bucketFill(canvas, { x: 150, y: 120 }, { color: "rgba(0, 0, 0, 0.5)" })
    ).not.toBeNull();
  });

  it("fills nothing for a point out of the canvas", () => {
    canvas.add(rectangle(50, 50, 200, 150));

    expect(bucketFill(canvas, { x: -5, y: 100 }, { color: "red" })).toBeNull();
    expect(bucketFill(canvas, { x: 100, y: 305 }, { color: "red" })).toBeNull();
    expect(bucketFill(canvas, { x: 400, y: 100 }, { color: "red" })).toBeNull();
  });

  describe("what closes an area", () => {
    it("is lines, as long as they meet", () => {
      canvas.add(
        line(50, 50, 250, 50),
        line(250, 50, 250, 200),
        line(250, 200, 50, 200),
        line(50, 200, 50, 120)
      );
      // There is a gap at the left, between the end of the last line and the first
      expect(bucketFill(canvas, { x: 150, y: 120 }, { color: "red" })).toBeNull();

      canvas.add(line(50, 130, 50, 50));
      fill(canvas, 150, 120, "#ff0000");

      expectColor(shown(canvas)(150, 120), RED);
    });

    it("is not a dashed line, which has gaps", () => {
      canvas.add(rectangle(50, 50, 200, 150, { strokeDashArray: [12, 12] }));

      expect(bucketFill(canvas, { x: 150, y: 120 }, { color: "red" })).toBeNull();
    });

    it("is a circle, a polygon and a curve of the pencil", () => {
      canvas.add(
        new fabric.Circle({
          originX: "left",
          originY: "top",
          left: 20,
          top: 20,
          radius: 50,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 4,
          strokeUniform: true,
          ...FROZEN,
        }),
        new fabric.Polygon(
          [
            { x: 160, y: 130 },
            { x: 220, y: 20 },
            { x: 280, y: 130 },
          ],
          {
            fill: "transparent",
            stroke: "black",
            strokeWidth: 4,
            strokeUniform: true,
            ...FROZEN,
          }
        ),
        new fabric.Path("M 50 280 C 50 160, 250 160, 250 280 Z", {
          fill: "",
          stroke: "black",
          strokeWidth: 5,
          strokeLineCap: "round",
          ...FROZEN,
        })
      );

      fill(canvas, 70, 70, "#ff0000");
      fill(canvas, 220, 90, "#00ff00");
      fill(canvas, 150, 240, "#0000ff");

      const at = shown(canvas);
      expectColor(at(70, 70), RED);
      expectColor(at(220, 90), GREEN);
      expectColor(at(150, 240), BLUE);
    });

    it("is the objects only, and not the background", () => {
      canvas.backgroundColor = "#eeeeee";
      canvas.add(rectangle(50, 50, 200, 150));

      fill(canvas, 150, 120, "#0000ff");

      expect(canvas.backgroundColor).toBe("#eeeeee");
      expectColor(shown(canvas)(150, 120), BLUE);
    });

    it("is not an object which is not visible", () => {
      const box = rectangle(50, 50, 200, 150);
      canvas.add(box);
      box.visible = false;

      expect(bucketFill(canvas, { x: 150, y: 120 }, { color: "red" })).toBeNull();
    });

    it("is the overlay image, which is an outline to draw within", async () => {
      const outline = new fabric.Canvas(undefined, { width: 300, height: 300 });
      outline.add(rectangle(60, 60, 150, 150));
      const overlay = await fabric.FabricImage.fromURL(
        outline.toDataURL({ format: "png", multiplier: 1 }),
        {},
        { originX: "left", originY: "top", left: 0, top: 0 }
      );
      void outline.dispose();
      canvas.overlayImage = overlay;

      fill(canvas, 130, 130, "#00ffff");

      expect(canvas.overlayImage).toBe(overlay);
      expect(shown(canvas)(130, 130)[1]).toBeGreaterThan(200);
    });
  });

  describe("an area with something in it", () => {
    it("is around it, so a circle in a rectangle leaves a ring", () => {
      canvas.add(
        rectangle(20, 20, 300, 220),
        new fabric.Circle({
          originX: "left",
          originY: "top",
          left: 120,
          top: 70,
          radius: 60,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 4,
          strokeUniform: true,
          ...FROZEN,
        })
      );

      fill(canvas, 40, 40, "#00aa00");

      const at = shown(canvas);
      expectColor(at(40, 40), [0, 170, 0, 255]);
      // The inside of the circle is another area
      expect(at(180, 130)[3]).toBe(0);
      fill(canvas, 180, 130, "#ffaa00");
      expectColor(shown(canvas)(180, 130), [255, 170, 0, 255]);
    });

    it("is one of the four which two lines make in a rectangle", () => {
      canvas.add(
        rectangle(50, 50, 200, 150),
        line(150, 50, 150, 200, 3),
        line(50, 125, 250, 125, 3)
      );

      fill(canvas, 100, 90, "#ff0000");
      fill(canvas, 200, 160, "#0000ff");

      const at = shown(canvas);
      expectColor(at(100, 90), RED);
      expectColor(at(200, 160), BLUE);
      expect(at(200, 90)[3]).toBe(0);
      expect(at(100, 160)[3]).toBe(0);
      // The lines are over the fills
      expectColor(at(150, 100), BLACK);
      expectColor(at(120, 125), BLACK);
    });
  });

  describe("the order of the objects", () => {
    it("puts a fill over the object it is in, and under the line which closes it", () => {
      canvas.add(
        rectangle(50, 50, 200, 150, { fill: "#ff0000" }),
        line(150, 50, 150, 200)
      );

      const { index } = fill(canvas, 100, 120, "#0000ff");

      expect(index).toBe(1);
      const at = shown(canvas);
      expectColor(at(100, 120), BLUE);
      expectColor(at(200, 120), RED);
      expectColor(at(150, 120), BLACK);
      // The fill does not spread past the edge of the rectangle it is in
      expect(at(46, 120)[3]).toBe(0);
    });

    it("puts a fill over the fill of the area, so it is filled again", () => {
      canvas.add(rectangle(50, 50, 200, 150));
      const first = fill(canvas, 150, 120, "#0000ff");

      const second = fill(canvas, 150, 120, "#00ff00");

      expect(second.index).toBe(first.index + 1);
      expectColor(shown(canvas)(150, 120), GREEN);
    });

    it("does not take the fills for what closes an area", () => {
      canvas.add(rectangle(50, 50, 200, 150), line(150, 50, 150, 200, 3));
      fill(canvas, 100, 120, "#0000ff");

      // The same area, with the fill of it in the way
      const again = fill(canvas, 100, 120, "#ff0000");

      expectColor(shown(canvas)(100, 120), RED);
      expect(again.fill.getBoundingRect().width).toBeLessThan(100);
    });
  });

  describe("a thin line", () => {
    it("has no color of the fill on the other side of it, and no seam", () => {
      replaceCanvas(200, 200);
      canvas.add(
        rectangle(20, 20, 140, 140, { strokeWidth: 1 }),
        line(20, 20, 161, 161, 1)
      );

      fill(canvas, 120, 50, "#ff0000");
      fill(canvas, 50, 120, "#0000ff");

      const at = shown(canvas);
      let red = 0;
      let blue = 0;
      let wrong = 0;
      for (let y = 24; y < 156; y++) {
        for (let x = 24; x < 156; x++) {
          const side = x - y;
          if (Math.abs(side) <= 2) continue;
          const [r, , b] = at(x, y);
          const isRed = r > 200 && b < 60;
          const isBlue = b > 200 && r < 60;
          if (side > 0) {
            if (isRed) red++;
            else if (isBlue) wrong++;
          } else if (isBlue) {
            blue++;
          } else if (isRed) {
            wrong++;
          }
        }
      }
      expect(wrong).toBe(0);
      expect(red).toBeGreaterThan(5000);
      expect(blue).toBeGreaterThan(5000);
    });
  });

  describe("the view", () => {
    it("is the one of the zoom and the position, and the fill is in the coordinates of the objects", () => {
      canvas.add(rectangle(50, 50, 100, 80));
      // The point (100, 90) of the objects is at (160, 150) of the canvas
      canvas.setViewportTransform([2, 0, 0, 2, -40, -30]);

      const { fill: path } = fill(canvas, 160, 150, "#ff00ff");

      const { left, top, width } = path.getBoundingRect();
      expect(left).toBeCloseTo(53.5, 0);
      expect(top).toBeCloseTo(53.5, 0);
      expect(width).toBeCloseTo(97, 0);
      expectColor(shown(canvas)(160, 150), [255, 0, 255, 255]);

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      expectColor(shown(canvas)(100, 90), [255, 0, 255, 255]);
    });

    it("has to show the whole area, so there is no fill for one which is partly out of it", () => {
      replaceCanvas(300, 300);
      canvas.add(rectangle(50, 50, 400, 300));

      expect(bucketFill(canvas, { x: 150, y: 120 }, { color: "red" })).toBeNull();

      canvas.setViewportTransform([0.5, 0, 0, 0.5, 0, 0]);
      expect(
        bucketFill(canvas, { x: 100, y: 100 }, { color: "red" })
      ).not.toBeNull();
    });
  });

  describe("saved and loaded", () => {
    it("is saved as a BucketFill, and loaded as one in the same place among the objects", async () => {
      canvas.add(rectangle(50, 50, 200, 150));
      fill(canvas, 150, 120, "#0000ff");
      const json = JSON.parse(JSON.stringify(canvas.toObject()));

      expect(json.objects.map((object: { type: string }) => object.type)).toEqual([
        "BucketFill",
        "Rect",
      ]);
      expect(JSON.stringify(json.objects[0]).length).toBeLessThan(1000);

      const loaded = new fabric.Canvas(undefined, { width: 400, height: 300 });
      await loaded.loadFromJSON(json);

      expect(loaded.getObjects()[0]).toBeInstanceOf(FillPath);
      expect(loaded.getObjects()[1]).toBeInstanceOf(fabric.Rect);
      expectColor(shown(loaded)(150, 120), BLUE);
      void loaded.dispose();
    });
  });

  describe("options", () => {
    it("takes the pixels of the edge of a line into the area with a tolerance, and not without one", () => {
      // The line is between pixels, so the pixel at each of its edges is half of it
      canvas.add(rectangle(50.5, 50.5, 200, 150));

      const strict = bucketFill(
        canvas,
        { x: 150, y: 120 },
        { color: "red", tolerance: 0 }
      );
      const loose = bucketFill(
        canvas,
        { x: 150, y: 120 },
        { color: "red", tolerance: 200 }
      );

      const widthOf = (result: BucketFillResult | null) =>
        (result as BucketFillResult).fill.getBoundingRect().width;
      expect(widthOf(loose)).toBeGreaterThan(widthOf(strict) + 1);
    });

    it("goes under the line by the overlap, or not at all", () => {
      canvas.add(rectangle(50, 50, 200, 150));

      const none = bucketFill(
        canvas,
        { x: 150, y: 120 },
        { color: "red", overlap: 0 }
      );
      const some = bucketFill(
        canvas,
        { x: 150, y: 120 },
        { color: "red", overlap: 3 }
      );

      const widthOf = (result: BucketFillResult | null) =>
        (result as BucketFillResult).fill.getBoundingRect().width;
      expect(widthOf(some)).toBeCloseTo(widthOf(none) + 2 * 3, 0);
    });

    it("keeps more points of the outline with less simplifying", () => {
      canvas.add(
        new fabric.Circle({
          originX: "left",
          originY: "top",
          left: 50,
          top: 50,
          radius: 100,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 3,
          strokeUniform: true,
          ...FROZEN,
        })
      );

      const exact = bucketFill(
        canvas,
        { x: 150, y: 150 },
        { color: "red", simplify: 0 }
      );
      const smooth = bucketFill(
        canvas,
        { x: 150, y: 150 },
        { color: "red", simplify: 1 }
      );

      const points = (result: BucketFillResult | null) =>
        (result as BucketFillResult).fill.path.length;
      expect(points(smooth)).toBeLessThan(points(exact) / 2);
      expect(points(smooth)).toBeGreaterThan(10);
    });
  });

  it("fills a big area in a moment", () => {
    replaceCanvas(1600, 1000);
    canvas.add(
      new fabric.Circle({
        originX: "left",
        originY: "top",
        left: 300,
        top: 100,
        radius: 400,
        fill: "transparent",
        stroke: "black",
        strokeWidth: 3,
        ...FROZEN,
      })
    );

    const start = performance.now();
    const result = bucketFill(canvas, { x: 700, y: 500 }, { color: "#123456" });

    expect(result).not.toBeNull();
    expect(performance.now() - start).toBeLessThan(2000);
  });
});
