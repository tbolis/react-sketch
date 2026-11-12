import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../../SketchField";
import { SketchProperties, Tool } from "../../../../types";
import { PressureBrush } from "./PressureBrush";
import { PressureStroke } from "./PressureStroke";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} lineWidth={10} {...props} />);
  const sketch = ref.current as SketchField;
  const canvas = sketch["canvas"] as fabric.Canvas;
  return {
    ...view,
    sketch,
    canvas,
    brush: () => canvas.freeDrawingBrush as PressureBrush,
    update: (next: SketchProperties) =>
      view.rerender(<SketchField ref={ref} lineWidth={10} {...next} />),
  };
};

const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, event);

/** The pointer event which comes before the mouse event of the same input */
const pointer = (type: string, pressure: number, name = "pointermove"): void => {
  const event = new MouseEvent(name, { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: type },
    pressure: { value: pressure },
  });
  document.dispatchEvent(event);
};

interface Sample {
  at: Point;
  pressure?: number;
}

/**
 * A stroke as the browser delivers it: the pointer event, and then the mouse event the canvas
 * reads. The pressure is of the pointer event.
 */
const stroke = (brush: PressureBrush, type: string, samples: Sample[]): void => {
  const mouse = (name: string) => ({ e: new MouseEvent(name) });
  const [first, ...rest] = samples;
  pointer(type, first.pressure ?? 0.5, "pointerdown");
  brush.onMouseDown(new fabric.Point(...first.at), mouse("mousedown") as never);
  rest.forEach(({ at, pressure }) => {
    pointer(type, pressure ?? 0.5);
    brush.onMouseMove(new fabric.Point(...at), mouse("mousemove") as never);
  });
  brush.onMouseUp(mouse("mouseup") as never);
};

const line = (from: Point, to: Point, pressure: number, parts = 8): Sample[] =>
  Array.from({ length: parts + 1 }, (_, i) => ({
    at: [
      from[0] + ((to[0] - from[0]) * i) / parts,
      from[1] + ((to[1] - from[1]) * i) / parts,
    ] as Point,
    pressure,
  }));

const lastPath = (canvas: fabric.Canvas): fabric.Path =>
  canvas.getObjects().slice(-1)[0] as fabric.Path;

/** The width of the stroke along it: the radius of each of its discs */
const radii = (path: fabric.Path): number[] =>
  (path as PressureStroke).discs.map(([, , r]) => r);

describe("pressureSensitive", () => {
  describe("a stroke of a pen", () => {
    it("is a filled path of the color, and not a line", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
        lineColor: "#ff0000",
      });

      stroke(brush(), "pen", line([20, 50], [220, 50], 0.5));

      const path = lastPath(canvas);
      expect(path).toBeInstanceOf(PressureStroke);
      expect(path).toBeInstanceOf(fabric.Path);
      expect(path.fill).toBe("#ff0000");
      expect(path.stroke).toBeNull();
      expect(canvas.getObjects()).toHaveLength(1);
    });

    it.each([
      [0.25, 5],
      [0.5, 10],
      [1, 20],
    ])("is as wide as the pressure says: %p gives %p", (pressure, width) => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });

      stroke(brush(), "pen", line([20, 80], [260, 80], pressure));

      const { height, width: length } = lastPath(canvas).getBoundingRect();
      expect(height).toBeCloseTo(width, 0);
      // The round ends: the line is as long as the stroke and half the width at each end
      expect(length).toBeCloseTo(240 + width, 0);
    });

    it("is never narrower than a tenth of the line width, nor wider than twice", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });

      stroke(brush(), "pen", line([20, 40], [200, 40], 0));
      stroke(brush(), "pen", line([20, 120], [200, 120], 1));

      const [light, hard] = canvas.getObjects();
      expect(light.getBoundingRect().height).toBeCloseTo(1, 0);
      expect(hard.getBoundingRect().height).toBeCloseTo(20, 0);
    });

    it("gets wider along the stroke when the pressure grows", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      const samples = Array.from({ length: 41 }, (_, i) => ({
        at: [20 + i * 6, 60] as Point,
        pressure: 0.1 + (0.8 * i) / 40,
      }));

      stroke(brush(), "pen", samples);

      const widths = radii(lastPath(canvas));
      expect(widths.length).toBeGreaterThan(40);
      expect(widths[0]).toBeLessThan(widths[widths.length - 1] / 3);
      widths
        .slice(1)
        .forEach((r, i) => expect(r).toBeGreaterThanOrEqual(widths[i] - 0.01));
    });

    it("is one disc when the pen does not move", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });

      stroke(brush(), "pen", [{ at: [100, 100], pressure: 0.75 }]);

      const path = lastPath(canvas);
      expect(path.getBoundingRect().width).toBeCloseTo(15, 0);
      expect(path.getBoundingRect().height).toBeCloseTo(15, 0);
    });

    it("is drawn where the pen was", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });

      stroke(brush(), "pen", line([100, 50], [300, 90], 0.5));

      const { left, top, width, height } = lastPath(canvas).getBoundingRect();
      expect(left).toBeCloseTo(95, 0);
      expect(left + width).toBeCloseTo(305, 0);
      expect(top).toBeLessThan(50);
      expect(top + height).toBeGreaterThan(90);
    });

    it("keeps a color which is not opaque as it is, and draws it whole while the pen moves", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
        lineColor: "rgba(255, 0, 0, 0.5)",
      });
      const clear = jest.spyOn(canvas, "clearContext");

      stroke(brush(), "pen", line([20, 50], [220, 50], 0.5));

      expect(lastPath(canvas).fill).toBe("rgba(255, 0, 0, 0.5)");
      // Cleared at each move, and once when the stroke was added
      expect(clear.mock.calls.length).toBeGreaterThan(5);
    });

    it("is one object and one undo step, and tells it was created", () => {
      const { canvas, brush, sketch } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      const created = jest.fn();
      canvas.on("path:created", created);

      stroke(brush(), "pen", line([20, 50], [220, 50], 0.5));

      expect(created).toHaveBeenCalledTimes(1);
      expect(created.mock.calls[0][0].path).toBe(lastPath(canvas));
      expect(sketch.canUndo()).toBe(true);
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
      sketch.redo();
      expect(canvas.getObjects()).toHaveLength(1);
    });

    it("is saved as the discs along it, and loaded as the same stroke", async () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      stroke(brush(), "pen", line([20, 50], [220, 90], 0.75));
      const path = lastPath(canvas);

      const json = JSON.parse(JSON.stringify(path.toObject()));
      const [loaded] = await fabric.util.enlivenObjects<PressureStroke>([json]);

      expect(json.type).toBe("PressureStroke");
      expect(json.path).toBeUndefined();
      expect(json.discs.length).toBeGreaterThan(10);
      expect(loaded).toBeInstanceOf(PressureStroke);
      expect(loaded.fill).toBe(path.fill);
      expect(loaded.path).toEqual(path.path);
      const [a, b] = [loaded.getBoundingRect(), path.getBoundingRect()];
      expect(a.left).toBeCloseTo(b.left, 6);
      expect(a.top).toBeCloseTo(b.top, 6);
      expect(a.width).toBeCloseTo(b.width, 6);
      expect(a.height).toBeCloseTo(b.height, 6);
    });

    it("is saved in a few kilobytes, as a long stroke of the pencil is", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      const samples = Array.from({ length: 150 }, (_, i) => ({
        at: [20 + i * 4, 100 + 30 * Math.sin(i / 8)] as Point,
        pressure: 0.3 + 0.4 * Math.abs(Math.sin(i / 20)),
      }));

      stroke(brush(), "pen", samples);

      expect(JSON.stringify(lastPath(canvas).toObject()).length).toBeLessThan(12000);
    });

    it("is copied as a stroke which keeps its shape", async () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      stroke(brush(), "pen", line([20, 50], [220, 90], 0.75));
      const path = lastPath(canvas) as PressureStroke;

      const copy = await path.clone();

      expect(copy).toBeInstanceOf(PressureStroke);
      expect((copy as PressureStroke).discs).toEqual(path.discs);
    });

    it("keeps its shape when it is moved, and undo and redo of the move", () => {
      const { canvas, brush, sketch, update } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      stroke(brush(), "pen", line([20, 50], [220, 90], 0.75));
      update({ tool: Tool.SELECT, pressureSensitive: true });
      const path = lastPath(canvas) as PressureStroke;
      const before = path.getBoundingRect();

      fire(canvas, "mouse:down", { e: new MouseEvent("mousedown"), target: path });
      path.set({ left: (path.left ?? 0) + 70, top: (path.top ?? 0) + 30 });
      path.setCoords();
      fire(canvas, "object:modified", { target: path });
      fire(canvas, "mouse:up", { e: new MouseEvent("mouseup") });
      expect(path.getBoundingRect().left).toBeCloseTo(before.left + 70, 3);
      sketch.undo();

      expect(path.getBoundingRect().left).toBeCloseTo(before.left, 3);
      expect(path.getBoundingRect().top).toBeCloseTo(before.top, 3);
    });

    it("is not drawn when the canvas stops it, as it does for a second finger", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      const mouse = (name: string) => ({ e: new MouseEvent(name) }) as never;
      pointer("pen", 0.5, "pointerdown");
      brush().onMouseDown(new fabric.Point(20, 20), mouse("mousedown"));
      pointer("pen", 0.5);
      brush().onMouseMove(new fabric.Point(80, 40), mouse("mousemove"));
      (canvas as unknown as { _isCurrentlyDrawing: boolean })._isCurrentlyDrawing =
        true;

      (canvas as unknown as { abortDrawing(): void }).abortDrawing();

      expect(
        (canvas as unknown as { _isCurrentlyDrawing: boolean })._isCurrentlyDrawing
      ).toBe(false);
      expect(canvas.getObjects()).toHaveLength(0);
      // The next stroke is drawn
      stroke(brush(), "pen", line([20, 50], [220, 50], 0.5));
      expect(canvas.getObjects()).toHaveLength(1);
      expect(lastPath(canvas)).toBeInstanceOf(PressureStroke);
    });

    it("leaves out the points which are too close to the one before", () => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      const near = Array.from({ length: 30 }, () => ({
        at: [100.1, 100.1] as Point,
        pressure: 0.5,
      }));

      stroke(brush(), "pen", [{ at: [100, 100], pressure: 0.5 }, ...near]);

      // One disc, as the pen did not leave its place
      expect(lastPath(canvas).getBoundingRect().width).toBeCloseTo(10, 0);
    });
  });

  describe("a stroke which is not of a pen", () => {
    it.each(["mouse", "touch"])("is a line as before, for a %s", (type) => {
      const { canvas, brush } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
        lineColor: "#00aa00",
      });

      stroke(brush(), type, line([20, 50], [220, 50], 0.9));

      const path = lastPath(canvas);
      expect(path.fill).toBeNull();
      expect(path.stroke).toBe("#00aa00");
      expect(path.strokeWidth).toBe(10);
    });

    it("is a line as before, for a pen, when pressureSensitive is off", () => {
      const { canvas, brush } = mount({ tool: Tool.PENCIL, lineColor: "#00aa00" });

      stroke(brush(), "pen", line([20, 50], [220, 50], 1));

      const path = lastPath(canvas);
      expect(path.fill).toBeNull();
      expect(path.stroke).toBe("#00aa00");
      expect(path.strokeWidth).toBe(10);
    });
  });

  describe("when the property or the tool changes", () => {
    it("draws a pen as a line again when it is turned off", () => {
      const { canvas, brush, update } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      stroke(brush(), "pen", line([20, 50], [220, 50], 1));

      update({ tool: Tool.PENCIL, pressureSensitive: false });
      stroke(brush(), "pen", line([20, 90], [220, 90], 1));

      const [pressed, plain] = canvas.getObjects() as fabric.Path[];
      expect(pressed.fill).not.toBeNull();
      expect(plain.fill).toBeNull();
      expect(plain.strokeWidth).toBe(10);
    });

    it("is not applied by the highlighter, which shares the brush", () => {
      const { canvas, brush, update } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });

      update({ tool: Tool.HIGHLIGHTER, pressureSensitive: true });
      stroke(brush(), "pen", line([20, 50], [220, 50], 1));

      const path = lastPath(canvas);
      expect(path.fill).toBeNull();
      expect(path.strokeWidth).toBe(10);
    });

    it("is applied again when the pencil comes back", () => {
      const { canvas, brush, update } = mount({
        tool: Tool.PENCIL,
        pressureSensitive: true,
      });
      update({ tool: Tool.HIGHLIGHTER, pressureSensitive: true });
      update({ tool: Tool.PENCIL, pressureSensitive: true });

      stroke(brush(), "pen", line([20, 50], [220, 50], 1));

      expect(lastPath(canvas).fill).not.toBeNull();
    });
  });

  describe("the pointers of the page", () => {
    it("are listened to only when the property is on", () => {
      const add = jest.spyOn(document, "addEventListener");

      mount({ tool: Tool.PENCIL });
      expect(add).not.toHaveBeenCalledWith(
        "pointermove",
        expect.anything(),
        expect.anything()
      );

      mount({ tool: Tool.PENCIL, pressureSensitive: true });
      expect(add).toHaveBeenCalledWith(
        "pointermove",
        expect.anything(),
        expect.anything()
      );
      expect(add).toHaveBeenCalledWith(
        "pointerdown",
        expect.anything(),
        expect.anything()
      );
    });

    it("stop being listened to when the canvas goes away", () => {
      const remove = jest.spyOn(document, "removeEventListener");
      const { unmount } = mount({ tool: Tool.PENCIL, pressureSensitive: true });

      unmount();

      expect(remove).toHaveBeenCalledWith(
        "pointermove",
        expect.anything(),
        expect.anything()
      );
      expect(remove).toHaveBeenCalledWith(
        "pointerdown",
        expect.anything(),
        expect.anything()
      );
    });

    it("stop being listened to when the property is turned off", () => {
      const remove = jest.spyOn(document, "removeEventListener");
      const { update } = mount({ tool: Tool.PENCIL, pressureSensitive: true });

      update({ tool: Tool.PENCIL, pressureSensitive: false });

      expect(remove).toHaveBeenCalledWith(
        "pointermove",
        expect.anything(),
        expect.anything()
      );
    });
  });
});
