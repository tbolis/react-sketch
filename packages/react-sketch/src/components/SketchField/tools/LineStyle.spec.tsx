import { createRef } from "react";
import { act, render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../SketchField";
import { LineStyle, SketchProperties, Tool } from "../../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return { ...view, sketch, canvas: sketch["canvas"] as fabric.Canvas };
};

const mouseEvent = (type: string, [x, y]: Point): MouseEvent =>
  new MouseEvent(type, {
    clientX: x,
    clientY: y,
    buttons: type === "mouseup" ? 0 : 1,
    bubbles: true,
    cancelable: true,
  });

/** Press the mouse at `from`, drag it to `to` and release it, as the browser tells the canvas */
const drag = (canvas: fabric.Canvas, from: Point, to: Point) => {
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", from));
  document.dispatchEvent(mouseEvent("mousemove", to));
  document.dispatchEvent(mouseEvent("mouseup", to));
};

/** Draw a free hand stroke, through the brush as the canvas does */
const stroke = (canvas: fabric.Canvas, points: Point[]): void => {
  const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
  const event = (type: string, [x, y]: Point) => ({
    e: new MouseEvent(type, { clientX: x, clientY: y }),
    pointer: new fabric.Point(x, y),
  });
  const [first, ...rest] = points;
  brush.onMouseDown(new fabric.Point(...first), event("mousedown", first));
  rest.forEach((point) =>
    brush.onMouseMove(new fabric.Point(...point), event("mousemove", point))
  );
  brush.onMouseUp(event("mouseup", points[points.length - 1]));
};

/** The object which carries the line of what was drawn: the shaft of an arrow */
const lined = (object: fabric.FabricObject): fabric.FabricObject => {
  if (object instanceof fabric.Group) return object.getObjects()[0];
  return object;
};

/** Run the gesture, and return the object with the line which it added to the canvas */
const drawn = (canvas: fabric.Canvas, gesture: (canvas: fabric.Canvas) => void) => {
  const before = canvas.getObjects();
  gesture(canvas);
  const added = canvas
    .getObjects()
    .filter((o) => !before.includes(o) && !(o instanceof fabric.Textbox));
  expect(added).toHaveLength(1);
  return lined(added[0]);
};

const STYLES: [LineStyle, number[], string][] = [
  ["dashed", [12, 8], "butt"],
  ["dotted", [0, 8], "round"],
  ["dash-dot", [8, 12, 0, 12], "round"],
];

describe("lineStyle", () => {
  describe.each<[string, Tool, (canvas: fabric.Canvas) => void]>([
    ["line", Tool.LINE, (canvas) => drag(canvas, [10, 10], [200, 90])],
    ["arrow", Tool.ARROW, (canvas) => drag(canvas, [10, 10], [200, 90])],
    ["rectangle", Tool.RECTANGLE, (canvas) => drag(canvas, [10, 10], [200, 90])],
    [
      "rectangle label",
      Tool.RECTANGLE_LABEL,
      (canvas) => drag(canvas, [10, 10], [200, 90]),
    ],
    ["circle", Tool.CIRCLE, (canvas) => drag(canvas, [10, 10], [200, 90])],
    [
      "polygon",
      Tool.POLYGON,
      (canvas) => {
        [
          [10, 10],
          [200, 10],
          [100, 90],
        ].forEach((point) => {
          act(() => jest.advanceTimersByTime(500));
          canvas.upperCanvasEl.dispatchEvent(
            mouseEvent("mousedown", point as Point)
          );
          document.dispatchEvent(mouseEvent("mouseup", point as Point));
        });
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      },
    ],
    [
      "pencil",
      Tool.PENCIL,
      (canvas) =>
        stroke(canvas, [
          [10, 10],
          [100, 50],
          [200, 90],
        ]),
    ],
  ])("the %s", (_name, tool, gesture) => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it.each(STYLES)(
      "draws a %s line, in the length of the width",
      (style, dash, cap) => {
        const { canvas } = mount({ tool, lineStyle: style, lineWidth: 4 });

        const object = drawn(canvas, gesture);

        expect(object.strokeDashArray).toEqual(dash);
        expect(object.strokeLineCap).toEqual(cap);
      }
    );

    it("draws a solid line by default, and when it is solid", () => {
      const defaults = mount({ tool, lineWidth: 4 });
      const unstyled = drawn(defaults.canvas, gesture);
      defaults.unmount();
      const { canvas } = mount({ tool, lineWidth: 4, lineStyle: "solid" });
      const solid = drawn(canvas, gesture);

      expect(unstyled.strokeDashArray ?? null).toBeNull();
      expect(solid.strokeDashArray ?? null).toBeNull();
      expect(solid.strokeLineCap).toEqual(unstyled.strokeLineCap);
    });

    it("changes with the property for the next drawing, and leaves the last", () => {
      const { canvas, rerender, sketch } = mount({
        tool,
        lineStyle: "dashed",
        lineWidth: 4,
      });
      const before = drawn(canvas, gesture);

      rerender(
        <SketchField
          ref={{ current: sketch }}
          tool={tool}
          lineStyle="dotted"
          lineWidth={4}
        />
      );
      const after = drawn(canvas, gesture);

      expect(before.strokeDashArray).toEqual([12, 8]);
      expect(after.strokeDashArray).toEqual([0, 8]);
    });
  });

  it("is saved by toJSON and loaded by fromJSON", async () => {
    jest.useFakeTimers();
    const { sketch, canvas } = mount({
      tool: Tool.RECTANGLE,
      lineStyle: "dotted",
      lineWidth: 4,
    });
    drag(canvas, [10, 10], [200, 90]);
    const value = sketch.toJSON();

    sketch.clear();
    sketch.fromJSON(value);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });

    const [rect] = canvas.getObjects();
    expect(rect.strokeDashArray).toEqual([0, 8]);
    expect(rect.strokeLineCap).toEqual("round");
    jest.useRealTimers();
  });

  describe("the arrow", () => {
    it("has a solid head, with the shaft in the line style", () => {
      const { canvas } = mount({
        tool: Tool.ARROW,
        lineStyle: "dashed",
        lineWidth: 4,
      });
      drag(canvas, [10, 10], [200, 90]);

      const [group] = canvas.getObjects() as fabric.Group[];
      const [shaft, head] = group.getObjects();
      expect(shaft.strokeDashArray).toEqual([12, 8]);
      expect(head.strokeDashArray ?? null).toBeNull();
    });
  });

  describe("the brush", () => {
    it("is dashed for the pencil, and the highlighter takes it back to solid", () => {
      const { canvas, rerender, sketch } = mount({
        tool: Tool.PENCIL,
        lineStyle: "dotted",
        lineWidth: 4,
      });
      const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
      expect(brush.strokeDashArray).toEqual([0, 8]);
      expect(brush.strokeLineCap).toEqual("round");

      rerender(
        <SketchField
          ref={{ current: sketch }}
          tool={Tool.HIGHLIGHTER}
          lineStyle="dashed"
          lineWidth={4}
        />
      );

      expect(brush.strokeDashArray).toBeNull();
      expect(brush.strokeLineCap).toEqual("round");
    });

    it("is solid again, with its round ends, when the pencil goes back to solid", () => {
      const { canvas, rerender, sketch } = mount({
        tool: Tool.PENCIL,
        lineStyle: "dashed",
        lineWidth: 4,
      });
      const brush = canvas.freeDrawingBrush as fabric.BaseBrush;
      expect(brush.strokeLineCap).toEqual("butt");

      rerender(
        <SketchField
          ref={{ current: sketch }}
          tool={Tool.PENCIL}
          lineStyle="solid"
          lineWidth={4}
        />
      );

      expect(brush.strokeDashArray).toBeNull();
      expect(brush.strokeLineCap).toEqual("round");
    });

    it("follows the width of the line", () => {
      const { canvas, rerender, sketch } = mount({
        tool: Tool.PENCIL,
        lineStyle: "dashed",
        lineWidth: 4,
      });
      rerender(
        <SketchField
          ref={{ current: sketch }}
          tool={Tool.PENCIL}
          lineStyle="dashed"
          lineWidth={10}
        />
      );

      expect((canvas.freeDrawingBrush as fabric.BaseBrush).strokeDashArray).toEqual([
        30, 20,
      ]);
    });
  });

  describe("the polygon in progress", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("draws its sides in the line style, and the dots and the ring without it", () => {
      const { canvas } = mount({
        tool: Tool.POLYGON,
        lineStyle: "dashed",
        lineWidth: 4,
      });
      [
        [10, 10],
        [200, 10],
      ].forEach((point) => {
        act(() => jest.advanceTimersByTime(500));
        canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", point as Point));
        document.dispatchEvent(mouseEvent("mouseup", point as Point));
      });

      const dashes = (canvas.contextTop.setLineDash as jest.Mock).mock.calls.map(
        ([dash]) => dash
      );
      expect(dashes).toContainEqual([12, 8]);
      // Reset right after the sides, so the dots and the ring are unbroken
      expect(dashes[dashes.length - 1]).toEqual([]);
    });
  });
});
