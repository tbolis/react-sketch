import { createRef } from "react";
import { act, render } from "@testing-library/react";
import * as fabric from "fabric";
import { bucketFill, FillPath } from "@react-sketch/bucket";
import SketchField from "../../SketchField";
import { SketchProperties, Tool, Tools } from "../../../../types";

// The pixels of a fill are the matter of bucketFill.spec: here it is what the tool and the history do with one
jest.mock("@react-sketch/bucket", () => ({
  ...jest.requireActual("@react-sketch/bucket"),
  bucketFill: jest.fn(),
}));

const bucketFillMock = bucketFill as jest.Mock;

type Point = [number, number];
type Identified = fabric.FabricObject & { id?: string };

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} tool={Tool.BUCKET_FILL} {...props} />);
  const sketch = ref.current as SketchField;
  return {
    ...view,
    sketch,
    canvas: sketch["canvas"] as fabric.Canvas,
    update: (next: SketchProperties) =>
      view.rerender(<SketchField ref={ref} tool={Tool.BUCKET_FILL} {...next} />),
  };
};

const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, event);

const mouseEvent = (type: string, [x, y]: Point): { e: MouseEvent } => ({
  e: new MouseEvent(type, { clientX: x, clientY: y }),
});

/** Press the mouse at the point and release it, as a click does */
const click = (canvas: fabric.Canvas, point: Point = [30, 40]): void => {
  fire(canvas, "mouse:down", mouseEvent("mousedown", point));
  fire(canvas, "mouse:up", mouseEvent("mouseup", point));
};

/** A fill, with an id to tell it among the objects */
const aFill = (id = "fill", color = "#0000ff"): FillPath => {
  const path = new FillPath("M 0 0 L 10 0 L 10 10 Z", { fill: color });
  (path as Identified).id = id;
  return path;
};

/** The bucket finds an area, and it is to go at the index among the objects */
const fillsAt = (index: number, id?: string): void => {
  bucketFillMock.mockReturnValueOnce({ fill: aFill(id), index });
};

const ids = (canvas: fabric.Canvas): (string | undefined)[] =>
  canvas.getObjects().map((object: Identified) => object.id);

/** Two rectangles under the tool of rectangles, then the bucket is the tool */
const withTwoRectangles = (props: SketchProperties = {}) => {
  const view = mount({ ...props, tool: Tool.RECTANGLE });
  ["rect1", "rect2"].forEach((id, i) => {
    fire(view.canvas, "mouse:down", mouseEvent("mousedown", [0, 0]));
    fire(view.canvas, "mouse:move", mouseEvent("mousemove", [10 + i, 10 + i]));
    fire(view.canvas, "mouse:up", mouseEvent("mouseup", [10 + i, 10 + i]));
    (view.canvas.getObjects().at(-1) as Identified).id = id;
  });
  view.update(props);
  return view;
};

describe("BucketFill", () => {
  beforeEach(() => {
    bucketFillMock.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is the bucket fill tool, by the name of the enumeration and the one of 0.5.x", () => {
    expect(Tool.BUCKET_FILL).toBe("bucket-fill");
    expect(Tools.BucketFill).toBe(Tool.BUCKET_FILL);
    expect(mount().sketch["tool"].type()).toBe(Tool.BUCKET_FILL);
  });

  describe("the color", () => {
    const colorOf = (props: SketchProperties): string => {
      const { canvas } = mount(props);
      click(canvas);
      return bucketFillMock.mock.calls[0][2].color;
    };

    it("is the fill color", () => {
      expect(colorOf({ fillColor: "blue", lineColor: "green" })).toBe("blue");
    });

    it("is the line color while the fill color is transparent, as it is by default", () => {
      expect(colorOf({ lineColor: "green" })).toBe("green");
      expect(colorOf({ fillColor: "transparent", lineColor: "green" })).toBe(
        "green"
      );
      expect(colorOf({ fillColor: "rgba(0, 0, 0, 0)", lineColor: "green" })).toBe(
        "green"
      );
    });

    it("is black when both are transparent", () => {
      expect(colorOf({ fillColor: "transparent", lineColor: "transparent" })).toBe(
        "black"
      );
    });

    it("follows the properties when they change", () => {
      const { canvas, update } = mount({ fillColor: "blue" });
      update({ fillColor: "red" });

      click(canvas);

      expect(bucketFillMock.mock.calls[0][2].color).toBe("red");
    });
  });

  describe("a click", () => {
    it("asks for the fill of the point, on the canvas", () => {
      const { canvas } = mount({ fillColor: "blue" });

      click(canvas, [30, 40]);

      expect(bucketFillMock).toHaveBeenCalledTimes(1);
      const [on, point, options] = bucketFillMock.mock.calls[0];
      expect(on).toBe(canvas);
      expect(point).toEqual(expect.objectContaining({ x: 30, y: 40 }));
      expect(options).toEqual({ color: "blue" });
    });

    it("puts the fill on the canvas, where it is to go among the objects", () => {
      const { canvas } = withTwoRectangles();
      fillsAt(1);

      click(canvas);

      expect(ids(canvas)).toEqual(["rect1", "fill", "rect2"]);
    });

    it("is one action of the sketch, which is told to the application", () => {
      const onObjectAdded = jest.fn();
      const onChange = jest.fn();
      const { canvas } = mount({ onObjectAdded, onChange });
      fillsAt(0);

      click(canvas);
      act(() => jest.advanceTimersByTime(20));

      expect(onObjectAdded).toHaveBeenCalledTimes(1);
      expect((onObjectAdded.mock.calls[0][0].target as Identified).id).toBe("fill");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("does nothing where there is nothing to fill", () => {
      const onObjectAdded = jest.fn();
      const onChange = jest.fn();
      const { canvas, sketch } = mount({ onObjectAdded, onChange });
      bucketFillMock.mockReturnValue(null);

      click(canvas);
      act(() => jest.advanceTimersByTime(20));

      expect(bucketFillMock).toHaveBeenCalledTimes(1);
      expect(canvas.getObjects()).toHaveLength(0);
      expect(onObjectAdded).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(sketch.canUndo()).toBe(false);
    });

    it("does nothing without the event of the pointer", () => {
      const { canvas } = mount();

      fire(canvas, "mouse:down", {});

      expect(bucketFillMock).not.toHaveBeenCalled();
    });

    it("fills what the click is on, as the objects are frozen and are not picked", () => {
      const { canvas } = withTwoRectangles();
      fillsAt(0);

      click(canvas);

      expect(canvas.selection).toBe(false);
      canvas.getObjects().forEach((object) => {
        expect(object.selectable).toBe(false);
        expect(object.evented).toBe(false);
      });
    });
  });

  describe("undo and redo", () => {
    it("takes the fill off with undo, and puts it back where it was with redo", () => {
      const { canvas, sketch } = withTwoRectangles();
      fillsAt(0);
      click(canvas);
      expect(ids(canvas)).toEqual(["fill", "rect1", "rect2"]);

      sketch.undo();
      expect(ids(canvas)).toEqual(["rect1", "rect2"]);

      // Not over the rectangles, which would hide the lines
      sketch.redo();
      expect(ids(canvas)).toEqual(["fill", "rect1", "rect2"]);
    });

    it("keeps the place of a fill which is between objects", () => {
      const { canvas, sketch } = withTwoRectangles();
      fillsAt(1);
      click(canvas);

      sketch.undo();
      sketch.redo();

      expect(ids(canvas)).toEqual(["rect1", "fill", "rect2"]);
    });

    it("puts the fills back in their places, one after the other", () => {
      const { canvas, sketch } = withTwoRectangles();
      fillsAt(0, "first");
      click(canvas);
      fillsAt(1, "second");
      click(canvas);
      expect(ids(canvas)).toEqual(["first", "second", "rect1", "rect2"]);

      sketch.undo();
      sketch.undo();
      expect(ids(canvas)).toEqual(["rect1", "rect2"]);
      sketch.redo();
      sketch.redo();

      expect(ids(canvas)).toEqual(["first", "second", "rect1", "rect2"]);
    });

    it("puts a fill which was removed back in its place with undo", () => {
      const { canvas, sketch } = withTwoRectangles();
      fillsAt(0);
      click(canvas);
      canvas.setActiveObject(canvas.getObjects()[0]);

      sketch.removeSelected();
      expect(ids(canvas)).toEqual(["rect1", "rect2"]);
      sketch.undo();

      expect(ids(canvas)).toEqual(["fill", "rect1", "rect2"]);
    });

    it("puts the objects which are on top back on top, as before", () => {
      const { canvas, sketch } = withTwoRectangles();
      canvas.setActiveObject(canvas.getObjects()[1]);

      sketch.removeSelected();
      sketch.undo();

      expect(ids(canvas)).toEqual(["rect1", "rect2"]);
    });
  });

  describe("the cursor", () => {
    const cursorOf = (canvas: fabric.Canvas): string => canvas.defaultCursor;
    /** The colors in a cursor are in hexadecimal, in whichever case */
    const drawnOf = (canvas: fabric.Canvas): string =>
      decodeURIComponent(cursorOf(canvas)).toLowerCase();

    it("is a bucket with a drop of the color, which falls back to the crosshair", () => {
      const { canvas } = mount({ fillColor: "#0000ff" });

      const cursor = cursorOf(canvas);

      expect(cursor).toMatch(
        /^url\("data:image\/svg\+xml,.+"\) \d+ \d+, crosshair$/
      );
      expect(drawnOf(canvas)).toContain('fill="#0000ff"');
    });

    it("has the color which fills, the line color when the fill color is transparent", () => {
      const { canvas } = mount({ lineColor: "#00ff00" });

      expect(drawnOf(canvas)).toContain('fill="#00ff00"');
    });

    it("follows the color", () => {
      const { canvas, update } = mount({ fillColor: "#0000ff" });

      update({ fillColor: "#ff0000" });

      expect(drawnOf(canvas)).toContain('fill="#ff0000"');
    });

    it("is the one of the pointer again with another tool", () => {
      const { canvas, update } = mount({ fillColor: "#0000ff" });

      update({ tool: Tool.RECTANGLE });

      expect(cursorOf(canvas)).toBe("default");
    });
  });
});
