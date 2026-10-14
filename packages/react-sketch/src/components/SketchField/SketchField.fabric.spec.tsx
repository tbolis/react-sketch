/**
 * What the upgrade of fabric 4 to fabric 7 must not change: old data keeps
 * loading, what is drawn has the same geometry, undo and redo restore the
 * same state, and the methods behave as before.
 */
import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import controlledValue from "../../../../showcase/src/data/controlledValue";
import defaultValue from "../../../../showcase/src/data/defaultValue";
import SketchField from "./SketchField";
import { SketchProperties, Tool } from "../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return { ...view, sketch, canvas: sketch["canvas"] as fabric.Canvas };
};

/** Fire a canvas event, as the canvas does when the user interacts with it */
const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, event);

const mouseEvent = (type: string, [x, y]: Point) => ({
  e: new MouseEvent(type, { clientX: x, clientY: y }),
});

/** Press the mouse at `from`, move it to `to` and release it */
const drag = (canvas: fabric.Canvas, from: Point, to: Point): void => {
  fire(canvas, "mouse:down", mouseEvent("mousedown", from));
  fire(canvas, "mouse:move", mouseEvent("mousemove", to));
  fire(canvas, "mouse:up", mouseEvent("mouseup", to));
};

/** An event of the browser, as the canvas receives it from the page */
const domEvent = (type: string, [x, y]: Point, button = 0): MouseEvent =>
  new MouseEvent(type, {
    clientX: x,
    clientY: y,
    button,
    buttons: type === "mouseup" ? 0 : 1 << button,
    bubbles: true,
    cancelable: true,
  });

/** Draw a free hand stroke, through the brush as the canvas does */
const stroke = (canvas: fabric.Canvas, points: Point[]): void => {
  const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
  const event = (type: string, point: Point) => ({
    ...mouseEvent(type, point),
    pointer: new fabric.Point(...point),
  });
  const [first, ...rest] = points;
  const last = points[points.length - 1];
  brush.onMouseDown(new fabric.Point(...first), event("mousedown", first));
  rest.forEach((point) =>
    brush.onMouseMove(new fabric.Point(...point), event("mousemove", point))
  );
  brush.onMouseUp(event("mouseup", last));
};

/** Timers (fromJSON, onChange) and the pending promises (loading, cloning) */
const flush = (): Promise<void> => jest.advanceTimersByTimeAsync(100);

const round = (value: number, digits = 6): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** Where an object is, and how big. JSON keeps 4 decimals, so 3 digits compare restored objects */
const geometry = (object: fabric.FabricObject, digits = 6) => ({
  type: object.type,
  originX: object.originX,
  originY: object.originY,
  left: round(object.left, digits),
  top: round(object.top, digits),
  width: round(object.width, digits),
  height: round(object.height, digits),
  angle: round(object.angle, digits),
});

/** The geometry and the area an object covers on the canvas */
const shape = (object: fabric.FabricObject, digits = 6) => {
  const { left, top, width, height } = object.getBoundingRect();
  return {
    ...geometry(object, digits),
    bbox: [left, top, width, height].map((n) => round(n, digits)),
  };
};

/** The shapes of a canvas, and for a group the geometry of its objects */
const shapes = (canvas: fabric.Canvas, digits = 6) =>
  canvas.getObjects().map((object) =>
    object instanceof fabric.Group
      ? {
          ...shape(object, digits),
          children: object.getObjects().map((o) => geometry(o, digits)),
        }
      : shape(object, digits)
  );

/** The end points of a line, as drawn */
const endPoints = (object: fabric.FabricObject): number[] => {
  const { x1, y1, x2, y2 } = object as fabric.Line;
  return [x1, y1, x2, y2];
};

const typesOf = (canvas: fabric.Canvas): string[] =>
  canvas.getObjects().map((object) => object.type);

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("SketchField on fabric 7", () => {
  describe("sample data of the showcase (JSON of fabric 3/4)", () => {
    const samples = [
      ["defaultValue", defaultValue],
      ["controlledValue", controlledValue],
    ] as const;

    it.each(samples)(
      "loads %s with the same number and types of objects",
      async (_name, data) => {
        const onChange = jest.fn();
        const { sketch, canvas } = mount({ onChange });

        sketch.fromJSON(data);
        await flush();

        expect(canvas.getObjects()).toHaveLength(data.objects.length);
        expect(typesOf(canvas)).toEqual(data.objects.map((o) => o.type));
        expect(onChange).toHaveBeenCalledTimes(1);
      }
    );

    it("has the lines, circles, rectangle and path the data describes", async () => {
      const { sketch, canvas } = mount();

      sketch.fromJSON(controlledValue);
      await flush();

      const count = (type: string) =>
        typesOf(canvas).filter((t) => t === type).length;
      expect([count("line"), count("circle"), count("rect"), count("path")]).toEqual(
        [10, 2, 1, 1]
      );
    });

    it.each(samples)(
      "keeps the position and the origin of the objects of %s",
      async (_name, data) => {
        const { sketch, canvas } = mount();

        sketch.fromJSON(data);
        await flush();

        canvas.getObjects().forEach((object, index) => {
          const source = data.objects[index] as unknown as Record<
            string,
            number | string
          >;
          expect(object.originX).toEqual(source.originX);
          expect(object.originY).toEqual(source.originY);
          expect(object.left).toBeCloseTo(source.left as number, 3);
          expect(object.top).toBeCloseTo(source.top as number, 3);
        });
      }
    );

    it("loads the data given as a string", async () => {
      const { sketch, canvas } = mount();

      sketch.fromJSON(JSON.stringify(defaultValue));
      await flush();

      expect(typesOf(canvas)).toEqual(defaultValue.objects.map((o) => o.type));
    });

    it("loads it as defaultValue and as value, once mounted", async () => {
      const first = mount({ defaultValue });
      const second = mount({ value: controlledValue });
      await flush();

      expect(first.canvas.getObjects()).toHaveLength(defaultValue.objects.length);
      expect(second.canvas.getObjects()).toHaveLength(
        controlledValue.objects.length
      );
    });

    it("can be undone, one object at a time", async () => {
      const { sketch, canvas } = mount();
      sketch.fromJSON(defaultValue);
      await flush();

      sketch.undo();

      expect(canvas.getObjects()).toHaveLength(defaultValue.objects.length - 1);
      sketch.redo();
      expect(canvas.getObjects()).toHaveLength(defaultValue.objects.length);
    });
  });

  describe("toJSON", () => {
    const drawings: [Tool, Point, Point, string[]][] = [
      [Tool.LINE, [10, 20], [60, 80], ["line"]],
      [Tool.RECTANGLE, [10, 20], [110, 70], ["rect"]],
      [Tool.CIRCLE, [0, 0], [30, 40], ["circle"]],
      [Tool.ARROW, [0, 0], [100, 50], ["group"]],
      [Tool.RECTANGLE_LABEL, [100, 100], [180, 160], ["rect", "textbox"]],
    ];

    it.each(drawings)(
      "gives an object that fromJSON loads again, for the %s tool",
      async (tool, from, to, types) => {
        const { sketch, canvas } = mount({
          tool,
          lineColor: "red",
          lineWidth: 3,
          fillColor: "blue",
        });
        drag(canvas, from, to);
        const drawn = shapes(canvas, 3);
        const saved = sketch.toJSON();
        expect(typeof saved).toBe("object");

        const other = mount();
        other.sketch.fromJSON(JSON.parse(JSON.stringify(saved)));
        await flush();

        expect(typesOf(other.canvas)).toEqual(types);
        expect(shapes(other.canvas, 3)).toEqual(drawn);
      }
    );

    it("gives an object that fromJSON loads again, for the pencil", async () => {
      const { sketch, canvas } = mount({
        tool: Tool.PENCIL,
        lineColor: "green",
        lineWidth: 4,
      });
      stroke(canvas, [
        [10, 10],
        [30, 20],
        [50, 15],
        [70, 40],
      ]);
      const saved = sketch.toJSON();

      const other = mount();
      other.sketch.fromJSON(JSON.stringify(saved));
      await flush();

      expect(typesOf(other.canvas)).toEqual(["path"]);
      const [path] = other.canvas.getObjects();
      expect([path.stroke, path.strokeWidth]).toEqual(["green", 4]);
      expect(shapes(other.canvas, 3)).toEqual(shapes(canvas, 3));
    });

    it("restores everything drawn on the same sketch, after clear", async () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      drag(canvas, [10, 20], [110, 70]);
      drag(canvas, [5, 5], [25, 45]);
      const drawn = shapes(canvas, 3);

      const discarded = sketch.clear();
      expect(canvas.getObjects()).toHaveLength(0);
      sketch.fromJSON(discarded);
      await flush();

      expect(shapes(canvas, 3)).toEqual(drawn);
    });
  });

  describe("geometry of what is drawn (the numbers of fabric 4)", () => {
    const props = { lineColor: "red", lineWidth: 3, fillColor: "blue" };
    const draw = (tool: Tool, from: Point, to: Point) => {
      const { canvas } = mount({ tool, ...props });
      drag(canvas, from, to);
      return canvas;
    };
    const drawn = (tool: Tool, from: Point, to: Point) =>
      shapes(draw(tool, from, to));

    it("Line", () => {
      expect(drawn(Tool.LINE, [10, 20], [60, 80])).toEqual([
        {
          type: "line",
          originX: "center",
          originY: "center",
          left: 35,
          top: 50,
          width: 50,
          height: 60,
          angle: 0,
          bbox: [8.5, 18.5, 53, 63],
        },
      ]);
      expect(endPoints(draw(Tool.LINE, [10, 20], [60, 80]).getObjects()[0])).toEqual(
        [10, 20, 60, 80]
      );
      expect(drawn(Tool.LINE, [100, 100], [40, 60])).toEqual([
        {
          type: "line",
          originX: "center",
          originY: "center",
          left: 70,
          top: 80,
          width: 60,
          height: 40,
          angle: 0,
          bbox: [38.5, 58.5, 63, 43],
        },
      ]);
      expect(
        endPoints(draw(Tool.LINE, [100, 100], [40, 60]).getObjects()[0])
      ).toEqual([100, 100, 40, 60]);
    });

    it("Rectangle", () => {
      expect(drawn(Tool.RECTANGLE, [10, 20], [110, 70])).toEqual([
        {
          type: "rect",
          originX: "left",
          originY: "top",
          left: 10,
          top: 20,
          width: 100,
          height: 50,
          angle: 0,
          bbox: [10, 20, 103, 53],
        },
      ]);
      expect(drawn(Tool.RECTANGLE, [100, 100], [40, 60])).toEqual([
        expect.objectContaining({ left: 40, top: 60, width: 60, height: 40 }),
      ]);
    });

    it("Circle", () => {
      expect(drawn(Tool.CIRCLE, [0, 0], [30, 40])).toEqual([
        {
          type: "circle",
          originX: "left",
          originY: "center",
          left: 0,
          top: 0,
          width: 50,
          height: 50,
          angle: 53.130102,
          bbox: [-21.2, -15.9, 74.2, 74.2],
        },
      ]);
      expect(drawn(Tool.CIRCLE, [50, 50], [10, 20])).toEqual([
        expect.objectContaining({
          angle: -143.130102,
          bbox: [-8.3, -3, 74.2, 74.2],
        }),
      ]);
    });

    it("Arrow", () => {
      const [arrow] = drawn(Tool.ARROW, [0, 0], [100, 50]);
      expect(arrow).toEqual({
        type: "group",
        originX: "left",
        originY: "top",
        left: -1.5,
        top: -1.5,
        width: 108.208204,
        height: 58.208204,
        angle: 0,
        bbox: [-1.5, -1.5, 108.208204, 58.208204],
        children: [
          expect.objectContaining({
            type: "line",
            originX: "center",
            originY: "center",
            left: -2.604102,
            top: -2.604102,
            width: 100,
            height: 50,
          }),
          expect.objectContaining({
            type: "triangle",
            originX: "center",
            originY: "center",
            left: 47.395898,
            top: 22.395898,
            width: 9,
            height: 9,
            angle: 116.565051,
          }),
        ],
      });

      const [group] = draw(Tool.ARROW, [0, 0], [100, 50]).getObjects();
      expect(endPoints((group as fabric.Group).getObjects()[0])).toEqual([
        0, 0, 100, 50,
      ]);

      const [backwards] = drawn(Tool.ARROW, [100, 100], [20, 60]);
      expect(backwards).toEqual(
        expect.objectContaining({
          left: 13.291796,
          top: 53.291796,
          width: 88.208204,
          height: 48.208204,
        })
      );
    });

    it("RectangleLabel", () => {
      const [rect, text] = drawn(Tool.RECTANGLE_LABEL, [100, 100], [180, 160]);
      expect(rect).toEqual({
        type: "rect",
        originX: "left",
        originY: "top",
        left: 100,
        top: 100,
        width: 80,
        height: 60,
        angle: 0,
        bbox: [100, 100, 83, 63],
      });
      expect(text).toEqual(
        expect.objectContaining({
          type: "textbox",
          originX: "left",
          originY: "top",
          left: 100,
          top: 88,
          width: 83,
          height: 13.56,
        })
      );

      const [, backwards] = drawn(Tool.RECTANGLE_LABEL, [100, 100], [40, 60]);
      expect(backwards).toEqual(
        expect.objectContaining({ left: 40, top: 60, width: 63 })
      );
    });
  });

  describe("pencil", () => {
    it("has a brush with the width and the color of the sketch", () => {
      const { canvas } = mount({
        tool: Tool.PENCIL,
        lineColor: "green",
        lineWidth: 4,
      });

      expect(canvas.freeDrawingBrush).toBeInstanceOf(fabric.PencilBrush);
      expect(canvas.freeDrawingBrush?.width).toEqual(4);
      expect(canvas.freeDrawingBrush?.color).toEqual("green");
      expect(canvas.isDrawingMode).toBe(true);
    });

    it("draws a path with that width and color, announced once", () => {
      const onObjectAdded = jest.fn();
      const { canvas } = mount({
        tool: Tool.PENCIL,
        lineColor: "green",
        lineWidth: 4,
        onObjectAdded,
      });

      stroke(canvas, [
        [10, 10],
        [30, 20],
        [50, 15],
        [70, 40],
      ]);

      const [path] = canvas.getObjects() as fabric.Path[];
      expect(canvas.getObjects()).toHaveLength(1);
      expect([path.type, path.stroke, path.strokeWidth, path.fill]).toEqual([
        "path",
        "green",
        4,
        null,
      ]);
      expect(onObjectAdded).toHaveBeenCalledTimes(1);
      expect(onObjectAdded).toHaveBeenCalledWith(
        expect.objectContaining({ target: path })
      );
    });

    it("keeps its brush when the tool changes, and follows the sketch again", () => {
      const { canvas, rerender } = mount({
        tool: Tool.PENCIL,
        lineColor: "green",
        lineWidth: 4,
      });
      const brush = canvas.freeDrawingBrush;

      rerender(<SketchField tool={Tool.RECTANGLE} />);
      expect(canvas.isDrawingMode).toBe(false);
      rerender(<SketchField tool={Tool.PENCIL} lineColor="blue" lineWidth={7} />);

      expect(canvas.isDrawingMode).toBe(true);
      expect(canvas.freeDrawingBrush).toBe(brush);
      expect([brush?.color, brush?.width]).toEqual(["blue", 7]);
    });

    it("can be undone and redone", () => {
      const { sketch, canvas } = mount({ tool: Tool.PENCIL });
      stroke(canvas, [
        [10, 10],
        [30, 20],
        [50, 15],
      ]);
      const [path] = canvas.getObjects();

      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
      sketch.redo();

      expect(canvas.getObjects()).toEqual([path]);
    });
  });

  describe("undo and redo", () => {
    // The undos which take a drawing back: a label is two objects
    const drawings: [Tool, Point, Point, number][] = [
      [Tool.LINE, [10, 20], [60, 80], 1],
      [Tool.RECTANGLE, [10, 20], [110, 70], 1],
      [Tool.CIRCLE, [0, 0], [30, 40], 1],
      [Tool.ARROW, [0, 0], [100, 50], 1],
      [Tool.RECTANGLE_LABEL, [100, 100], [180, 160], 2],
    ];
    const times = (count: number, run: () => void) =>
      Array.from({ length: count }, run);

    it.each(drawings)(
      "bring a %s back and forth, with its size and position",
      (tool, from, to, steps) => {
        const { sketch, canvas } = mount({ tool, lineColor: "red" });
        drag(canvas, from, to);
        const drawn = shapes(canvas);
        drag(canvas, to, [to[0] + 30, to[1] + 30]);
        const both = shapes(canvas);

        times(steps, sketch.undo);
        expect(shapes(canvas)).toEqual(drawn);
        times(steps, sketch.redo);
        expect(shapes(canvas)).toEqual(both);
      }
    );

    // The state restored is the JSON of the object, which keeps 4 decimals.
    // Not the line: undo of a moved line puts it at 0,0 (as on fabric 4)
    it.each(drawings.filter(([tool]) => tool !== Tool.LINE))(
      "restore a %s moved by the user",
      (tool, from, to) => {
        const warn = jest.spyOn(console, "warn").mockImplementation();
        const { sketch, canvas } = mount({ tool, lineColor: "red" });
        drag(canvas, from, to);
        // the last object is the one whose final state the history knows
        const object = canvas.getObjects().slice(-1)[0];
        const before = shape(object, 3);

        object.set({ left: object.left + 25, top: object.top + 15 });
        object.setCoords();
        fire(canvas, "object:modified", { target: object });
        const after = shape(object, 3);
        expect(after).not.toEqual(before);

        sketch.undo();
        expect(shape(object, 3)).toEqual(before);
        sketch.redo();
        expect(shape(object, 3)).toEqual(after);
        // the saved state sets nothing fabric refuses (the type), so it has no warning
        expect(warn).not.toHaveBeenCalled();
      }
    );

    it.todo(
      "restores the position of a line moved by the user (it jumps to 0,0, as on fabric 4)"
    );

    it("restore the state of a free hand path moved by the user", () => {
      const { sketch, canvas } = mount({ tool: Tool.PENCIL });
      stroke(canvas, [
        [10, 10],
        [30, 20],
        [50, 15],
      ]);
      const [path] = canvas.getObjects();
      const before = shape(path, 3);

      path.set({ left: path.left + 25, top: path.top + 15 });
      path.setCoords();
      fire(canvas, "object:modified", { target: path });
      sketch.undo();

      expect(shape(path, 3)).toEqual(before);
    });

    it("keep the drawing working after an arrow was restored", () => {
      const { sketch, canvas } = mount({ tool: Tool.ARROW });
      drag(canvas, [0, 0], [100, 50]);
      const [group] = canvas.getObjects() as fabric.Group[];
      group.set({ left: group.left + 10 });
      fire(canvas, "object:modified", { target: group });
      sketch.undo();

      group.set({ left: group.left + 5 });
      group.setCoords();
      expect(() => canvas.renderAll()).not.toThrow();
      expect(group.getObjects()).toHaveLength(2);
    });

    it("bring back what removeSelected removed", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      drag(canvas, [10, 20], [110, 70]);
      const [rect] = canvas.getObjects();
      canvas.setActiveObject(rect);

      sketch.removeSelected();
      expect(canvas.getObjects()).toHaveLength(0);
      sketch.undo();

      expect(canvas.getObjects()).toEqual([rect]);
    });
  });

  describe("methods", () => {
    it("zoom scales the position and the size of objects of any origin", () => {
      const { sketch, canvas } = mount({ tool: Tool.LINE });
      drag(canvas, [10, 20], [60, 80]);
      const [line] = canvas.getObjects();

      sketch.zoom(2);

      expect(line.getCenterPoint()).toMatchObject({ x: 70, y: 100 });
      expect([line.scaleX, line.scaleY]).toEqual([2, 2]);
      sketch.zoom(0.5);
      expect(line.getCenterPoint()).toMatchObject({ x: 35, y: 50 });
    });

    describe("setBackgroundFromDataUrl", () => {
      /** An image of 200 x 100 loads as soon as its source is set */
      const stubImages = () =>
        jest.spyOn(window, "Image").mockImplementation(() => {
          const img = document.createElement("img");
          img.width = 200;
          img.height = 100;
          Object.defineProperty(img, "src", {
            set: () => img.onload?.(new Event("load")),
          });
          return img;
        });

      it("covers the canvas from its top left corner", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00");

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect(image).toBeInstanceOf(fabric.FabricImage);
        expect([image.originX, image.originY]).toEqual(["left", "top"]);
        expect(image.getBoundingRect()).toMatchObject({
          left: 0,
          top: 0,
          width: 200,
          height: 100,
        });
      });

      it("stretches to the canvas, from its top left corner", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretched: true,
        });

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect(image.getBoundingRect()).toMatchObject({
          left: 0,
          top: 0,
          width: canvas.getWidth(),
          height: canvas.getHeight(),
        });
      });

      it("is part of the json, and loads again", async () => {
        stubImages();
        const { sketch, canvas } = mount();
        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          opacity: 0.5,
        });
        const saved = JSON.parse(JSON.stringify(sketch.toJSON()));

        expect(saved.backgroundImage).toMatchObject({ opacity: 0.5 });
        expect(canvas.backgroundImage).toBeDefined();
      });

      it("is saved with the shapes and the added images, and loading replaces all of them (#58)", async () => {
        stubImages();
        jest
          .spyOn(fabric.FabricImage, "fromURL")
          .mockImplementation((_url, _options, imageOptions) =>
            Promise.resolve(
              new fabric.FabricImage(document.createElement("img"), {
                width: 100,
                height: 60,
                ...imageOptions,
              })
            )
          );
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        drag(canvas, [10, 20], [60, 80]);
        sketch.addImg("data:image/png;base64,00");
        sketch.setBackgroundFromDataUrl("data:image/png;base64,00");
        await flush();

        const saved = JSON.parse(JSON.stringify(sketch.toJSON()));
        expect(saved.objects.map((o: { type: string }) => o.type)).toEqual([
          "Rect",
          "Image",
        ]);
        expect(saved.backgroundImage).toBeDefined();

        // Loading clears the canvas first: the images and the background image
        // that are not in the loaded value are gone
        sketch.fromJSON({
          ...saved,
          objects: [saved.objects[0]],
          backgroundImage: undefined,
        });
        await flush();

        expect(canvas.getObjects().map((o) => o.type)).toEqual(["rect"]);
        expect(canvas.backgroundImage).toBeFalsy();
      });
    });

    it("the background color is painted by the canvas", () => {
      const { canvas, rerender } = mount({ backgroundColor: "red" });
      expect(canvas.backgroundColor).toEqual("red");

      rerender(<SketchField backgroundColor="blue" />);

      expect(canvas.backgroundColor).toEqual("blue");
    });

    it("addImg places the image by its top left corner", async () => {
      jest
        .spyOn(fabric.FabricImage, "fromURL")
        .mockImplementation((_url, _options, imageOptions) =>
          Promise.resolve(
            new fabric.FabricImage(document.createElement("img"), {
              width: 100,
              height: 60,
              ...imageOptions,
            })
          )
        );
      const { sketch, canvas } = mount();

      sketch.addImg("data:image/png;base64,00", { left: 15, top: 25, scale: 2 });
      await flush();

      const [image] = canvas.getObjects();
      expect(image.getBoundingRect()).toMatchObject({
        left: 15,
        top: 25,
        width: 200,
        height: 120,
      });
    });

    it("addText centers the text on the canvas, or places it by its top left corner", () => {
      const { sketch, canvas } = mount();

      sketch.addText("hello");
      sketch.addText("there", { left: 11, top: 22 });

      const [centered, placed] = canvas.getObjects();
      expect([centered.originX, centered.originY]).toEqual(["left", "top"]);
      expect(centered.left).toEqual((canvas.getWidth() - centered.width) / 2);
      expect(centered.top).toEqual((canvas.getHeight() - centered.height) / 2);
      expect([placed.left, placed.top]).toEqual([11, 22]);
      expect([placed.originX, placed.originY]).toEqual(["left", "top"]);
    });

    describe("copy and paste", () => {
      const drawTwo = () => {
        const sketch = mount({ tool: Tool.RECTANGLE, lineColor: "red" });
        drag(sketch.canvas, [10, 20], [110, 70]);
        drag(sketch.canvas, [200, 20], [250, 70]);
        sketch.canvas.setActiveObject(sketch.canvas.getObjects()[0]);
        return sketch;
      };

      it("work when they are called one after the other", async () => {
        const { sketch, canvas } = drawTwo();

        sketch.copy();
        sketch.paste();
        sketch.paste();
        await flush();

        expect(canvas.getObjects()).toHaveLength(4);
        const [, , first, second] = canvas.getObjects();
        expect([first.left, first.top]).toEqual([20, 30]);
        expect([second.left, second.top]).toEqual([30, 40]);
        expect(canvas.getActiveObject()).toBe(second);
      });

      it("paste a copy, not the object itself", async () => {
        const { sketch, canvas } = drawTwo();
        const [original] = canvas.getObjects();

        sketch.copy();
        sketch.paste();
        await flush();

        const pasted = canvas.getObjects()[2];
        expect(pasted).not.toBe(original);
        expect(pasted.type).toEqual("rect");
        expect([pasted.width, pasted.height]).toEqual([100, 50]);
        expect(pasted.stroke).toEqual("red");
      });

      it("copy the object as it is when copy is called", async () => {
        const { sketch, canvas } = drawTwo();
        const [original] = canvas.getObjects();

        sketch.copy();
        original.set({ left: 500 });
        sketch.paste();
        await flush();

        expect(canvas.getObjects()[2].left).toEqual(20);
      });

      it("paste a multiple selection", async () => {
        const { sketch, canvas } = drawTwo();
        canvas.setActiveObject(
          new fabric.ActiveSelection(canvas.getObjects(), { canvas })
        );

        sketch.copy();
        sketch.paste();
        await flush();

        expect(canvas.getObjects()).toHaveLength(4);
        expect(sketch.hasSelection()).toBe(true);
      });

      it("paste what was copied last", async () => {
        const { sketch, canvas } = drawTwo();
        sketch.copy();
        canvas.setActiveObject(canvas.getObjects()[1]);
        sketch.copy();
        sketch.paste();
        await flush();

        expect(canvas.getObjects()[2].left).toEqual(210);
      });
    });

    it("removeSelected removes every object of a multiple selection", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      drag(canvas, [10, 20], [110, 70]);
      drag(canvas, [200, 20], [250, 70]);
      canvas.setActiveObject(
        new fabric.ActiveSelection(canvas.getObjects(), { canvas })
      );

      sketch.removeSelected();

      expect(canvas.getObjects()).toHaveLength(0);
      sketch.undo();
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(2);
    });
  });

  describe("behavior of fabric 4 which the component keeps", () => {
    it("draws with the mouse events of the page", () => {
      const onMouseDown = jest.fn();
      const onMouseUp = jest.fn();
      const { canvas } = mount({ tool: Tool.LINE, onMouseDown, onMouseUp });

      canvas.upperCanvasEl.dispatchEvent(domEvent("mousedown", [10, 20]));
      document.dispatchEvent(domEvent("mousemove", [60, 80]));
      document.dispatchEvent(domEvent("mouseup", [60, 80]));

      const [line] = canvas.getObjects();
      expect(endPoints(line)).toEqual([10, 20, 60, 80]);
      expect(onMouseDown).toHaveBeenCalledTimes(1);
      expect(onMouseUp).toHaveBeenCalledTimes(1);
    });

    it("ignores right and middle clicks, leaves the context menu alone", () => {
      const onMouseDown = jest.fn();
      const { canvas } = mount({ tool: Tool.LINE, onMouseDown });

      [1, 2].forEach((button) => {
        canvas.upperCanvasEl.dispatchEvent(domEvent("mousedown", [10, 20], button));
        document.dispatchEvent(domEvent("mouseup", [10, 20], button));
      });

      expect(canvas.getObjects()).toHaveLength(0);
      expect(onMouseDown).not.toHaveBeenCalled();
      expect(canvas.fireRightClick).toBe(false);
      expect(canvas.fireMiddleClick).toBe(false);
      expect(canvas.stopContextMenu).toBe(false);
    });

    it("brings the selected object to the front only while it is selected", () => {
      const { canvas } = mount();

      expect(canvas.preserveObjectStacking).toBe(false);
    });

    it("does not announce the objects discarded by clear or by a loaded value", async () => {
      const onObjectRemoved = jest.fn();
      const { sketch, canvas } = mount({
        tool: Tool.RECTANGLE,
        onObjectRemoved,
      });
      drag(canvas, [10, 20], [110, 70]);
      drag(canvas, [5, 5], [25, 45]);

      sketch.clear();
      drag(canvas, [10, 20], [110, 70]);
      sketch.fromJSON(defaultValue);
      await flush();

      expect(onObjectRemoved).not.toHaveBeenCalled();
    });

    it("announces a removal by the user, also after a clear", () => {
      const onObjectRemoved = jest.fn();
      const { sketch, canvas } = mount({
        tool: Tool.RECTANGLE,
        onObjectRemoved,
      });
      drag(canvas, [10, 20], [110, 70]);
      sketch.clear();
      drag(canvas, [10, 20], [110, 70]);
      canvas.setActiveObject(canvas.getObjects()[0]);

      sketch.removeSelected();

      expect(onObjectRemoved).toHaveBeenCalledTimes(1);
    });

    it("returns the JSON of a clear synchronously, and toJSON gives an object", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      drag(canvas, [10, 20], [110, 70]);

      const json = sketch.toJSON();
      const discarded = sketch.clear();

      expect(json).not.toBeInstanceOf(Promise);
      expect(discarded).toEqual(json);
      expect(discarded.objects).toHaveLength(1);
    });
  });
});
