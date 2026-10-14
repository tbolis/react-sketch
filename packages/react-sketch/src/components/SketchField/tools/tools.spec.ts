/**
 * @jest-environment jsdom
 */
import "jest-canvas-mock";
import * as fabric from "fabric";
import { Tool } from "../../../types";
import { CanvasEvent } from "../events";
import { FabricCanvasTool } from "./index";
import { create_tool } from "./factory";

type Point = [number, number];

const mouseEvent = (type: string, [x, y]: Point): CanvasEvent => ({
  e: new MouseEvent(type, { clientX: x, clientY: y }),
});

/** Fire a canvas event, as the canvas does when the user interacts with it */
const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(
    name,
    event
  );

const down = (tool: FabricCanvasTool, point: Point) =>
  tool.doMouseDown(mouseEvent("mousedown", point));
const move = (tool: FabricCanvasTool, point: Point) =>
  tool.doMouseMove(mouseEvent("mousemove", point));
const up = (tool: FabricCanvasTool, point: Point) =>
  tool.doMouseUp(mouseEvent("mouseup", point));

/** Press the mouse at `from`, move it to `to` and release it */
const drag = (tool: FabricCanvasTool, from: Point, to: Point) => {
  down(tool, from);
  move(tool, to);
  up(tool, to);
};

describe("Tools", () => {
  let canvas: fabric.Canvas;

  beforeEach(() => {
    canvas = new fabric.Canvas(document.createElement("canvas"));
  });

  afterEach(() => {
    canvas.dispose();
  });

  describe("factory", () => {
    it.each(Object.values(Tool))("creates the %s tool", (name) => {
      const tool = create_tool(canvas, { tool: name, lineColor: "red" });
      expect(tool.type()).toEqual(name);
    });

    it("falls back to the pencil for unknown tools", () => {
      const tool = create_tool(canvas, { tool: "does-not-exist" });
      expect(tool.type()).toEqual(Tool.PENCIL);
    });

    it("resets the cursor changed by the previous tool", () => {
      create_tool(canvas, { tool: Tool.PAN });
      expect(canvas.defaultCursor).toEqual("move");
      create_tool(canvas, { tool: Tool.LINE });
      expect(canvas.defaultCursor).toEqual("default");
    });
  });

  describe("Line", () => {
    it("draws a line following the mouse", () => {
      const tool = create_tool(canvas, {
        tool: Tool.LINE,
        lineColor: "red",
        lineWidth: 3,
      });
      down(tool, [10, 20]);
      move(tool, [60, 80]);
      up(tool, [60, 80]);

      const [line] = canvas.getObjects() as fabric.Line[];
      expect(canvas.getObjects()).toHaveLength(1);
      expect([line.x1, line.y1, line.x2, line.y2]).toEqual([10, 20, 60, 80]);
      expect(line.stroke).toEqual("red");
      expect(line.strokeWidth).toEqual(3);
    });

    it("stops drawing once the mouse is released", () => {
      const tool = create_tool(canvas, { tool: Tool.LINE });
      drag(tool, [10, 20], [60, 80]);
      move(tool, [5, 5]);

      const [line] = canvas.getObjects() as fabric.Line[];
      expect([line.x2, line.y2]).toEqual([60, 80]);
    });
  });

  describe("Rectangle", () => {
    it("draws a rectangle with the given colors", () => {
      const tool = create_tool(canvas, {
        tool: Tool.RECTANGLE,
        lineColor: "red",
        lineWidth: 3,
        fillColor: "blue",
      });
      drag(tool, [10, 20], [110, 70]);

      const [rect] = canvas.getObjects() as fabric.Rect[];
      expect(canvas.getObjects()).toHaveLength(1);
      expect([rect.left, rect.top, rect.width, rect.height]).toEqual([
        10,
        20,
        100,
        50,
      ]);
      expect(rect.stroke).toEqual("red");
      expect(rect.strokeWidth).toEqual(3);
      expect(rect.fill).toEqual("blue");
    });

    it("is transparent by default", () => {
      const tool = create_tool(canvas, { tool: Tool.RECTANGLE });
      down(tool, [10, 20]);

      const [rect] = canvas.getObjects() as fabric.Rect[];
      expect(rect.fill).toEqual("transparent");
    });

    it("draws towards the top left and back", () => {
      const tool = create_tool(canvas, { tool: Tool.RECTANGLE });
      down(tool, [100, 100]);
      move(tool, [40, 60]);

      const [rect] = canvas.getObjects() as fabric.Rect[];
      expect([rect.left, rect.top, rect.width, rect.height]).toEqual([
        40,
        60,
        60,
        40,
      ]);

      move(tool, [150, 130]);
      expect([rect.left, rect.top, rect.width, rect.height]).toEqual([
        100,
        100,
        50,
        30,
      ]);
    });
  });

  describe("Circle", () => {
    it("draws a circle having the drag segment as diameter", () => {
      const tool = create_tool(canvas, {
        tool: Tool.CIRCLE,
        lineColor: "red",
        lineWidth: 3,
        fillColor: "blue",
      });
      drag(tool, [0, 0], [30, 40]);

      const [circle] = canvas.getObjects() as fabric.Circle[];
      expect(canvas.getObjects()).toHaveLength(1);
      expect(circle.radius).toEqual(25);
      expect(circle.angle).toBeCloseTo(53.13, 2);
      expect([circle.left, circle.top]).toEqual([0, 0]);
      expect(circle.stroke).toEqual("red");
      expect(circle.strokeWidth).toEqual(3);
      expect(circle.fill).toEqual("blue");
    });
  });

  describe("Arrow", () => {
    it("draws a line with a head pointing at the mouse", () => {
      const tool = create_tool(canvas, { tool: Tool.ARROW, lineWidth: 3 });
      down(tool, [0, 0]);
      move(tool, [100, 0]);

      const [line, head] = canvas.getObjects();
      expect(canvas.getObjects()).toHaveLength(2);
      expect(line.type).toEqual("line");
      expect(head.type).toEqual("triangle");
      expect([head.left, head.top, head.angle]).toEqual([100, 0, 90]);

      move(tool, [0, 100]);
      expect(head.angle).toEqual(180);
    });

    it("groups the line and the head on release", () => {
      const tool = create_tool(canvas, { tool: Tool.ARROW });
      drag(tool, [0, 0], [100, 50]);

      const [group] = canvas.getObjects() as fabric.Group[];
      expect(canvas.getObjects()).toHaveLength(1);
      expect(group.type).toEqual("group");
      expect(group.getObjects().map((o) => o.type)).toEqual(["line", "triangle"]);

      // a release without a preceding press adds nothing
      up(tool, [100, 50]);
      expect(canvas.getObjects()).toHaveLength(1);
    });
  });

  describe("RectangleLabel", () => {
    it("draws a rectangle with a label on top of it", () => {
      const tool = create_tool(canvas, {
        tool: Tool.RECTANGLE_LABEL,
        lineColor: "red",
      });
      drag(tool, [100, 100], [180, 160]);

      const [rect, text] = canvas.getObjects() as [fabric.Rect, fabric.Textbox];
      expect(canvas.getObjects()).toHaveLength(2);
      expect([rect.left, rect.top, rect.width, rect.height]).toEqual([
        100,
        100,
        80,
        60,
      ]);
      expect(text.text).toEqual("New drawing");
      expect(text.backgroundColor).toEqual("red");
    });

    it("moves the label along with the rectangle", () => {
      const tool = create_tool(canvas, { tool: Tool.RECTANGLE_LABEL });
      drag(tool, [100, 100], [180, 160]);

      const [rect, text] = canvas.getObjects() as [fabric.Rect, fabric.Textbox];
      rect.set({ left: 200, top: 150 });
      fire(canvas, "object:moving", { target: rect });

      expect(text.left).toEqual(200);
      expect(text.top).toEqual(150 - text.getScaledHeight());
    });
  });

  describe("Pan", () => {
    it("moves the viewport while the mouse is pressed", () => {
      const tool = create_tool(canvas, { tool: Tool.PAN });
      down(tool, [10, 10]);
      move(tool, [30, 25]);
      up(tool, [30, 25]);
      move(tool, [100, 100]);

      const [, , , , x, y] = canvas.viewportTransform as number[];
      expect([x, y]).toEqual([20, 15]);
    });
  });

  describe("Select and DefaultTool", () => {
    it("toggle the interactivity of the existing objects", () => {
      const rect = new fabric.Rect({ width: 5, height: 5 });
      canvas.add(rect);

      create_tool(canvas, { tool: Tool.LINE });
      expect([canvas.selection, rect.selectable, rect.evented]).toEqual([
        false,
        false,
        false,
      ]);

      create_tool(canvas, { tool: Tool.SELECT });
      expect([canvas.selection, rect.selectable, rect.evented]).toEqual([
        true,
        true,
        true,
      ]);

      canvas.setActiveObject(rect);
      create_tool(canvas, { tool: Tool.DEFAULT_TOOL });
      expect(canvas.getActiveObject()).toBeUndefined();
      expect([canvas.selection, rect.selectable, rect.evented]).toEqual([
        false,
        false,
        false,
      ]);
      expect(canvas.defaultCursor).toEqual("pointer");
    });
  });

  describe("Pencil and Highlighter", () => {
    it("configure the free drawing brush", () => {
      create_tool(canvas, {
        tool: Tool.PENCIL,
        lineColor: "green",
        lineWidth: 4,
      });
      expect(canvas.isDrawingMode).toBe(true);
      expect(canvas.freeDrawingBrush?.color).toEqual("green");
      expect(canvas.freeDrawingBrush?.width).toEqual(4);

      create_tool(canvas, {
        tool: Tool.HIGHLIGHTER,
        lineColor: "#ff0000",
        lineWidth: 8,
      });
      expect(canvas.freeDrawingBrush?.color).toEqual("rgba(255,0,0,0.4)");
      expect(canvas.freeDrawingBrush?.width).toEqual(8);
    });

    it("highlights with color names", () => {
      create_tool(canvas, { tool: Tool.HIGHLIGHTER, lineColor: "Red" });
      expect(canvas.freeDrawingBrush?.color).toEqual("rgba(255,0,0,0.4)");
    });

    it("rejects highlighter colors it cannot convert", () => {
      expect(() =>
        create_tool(canvas, { tool: Tool.HIGHLIGHTER, lineColor: "nope" })
      ).toThrow(/Bad hex color/);
    });
  });
});
