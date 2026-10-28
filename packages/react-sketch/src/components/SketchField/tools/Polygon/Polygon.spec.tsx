import { createRef } from "react";
import { act, render, waitFor } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../../SketchField";
import { SketchProperties, Tool, Tools } from "../../../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} tool={Tool.POLYGON} {...props} />);
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

/** Let the time pass, so the next click is not the second of a double click */
const wait = (ms = 500) => act(() => jest.advanceTimersByTime(ms));

const hover = (canvas: fabric.Canvas, point: Point) =>
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousemove", point));

/** Press and release the mouse at the point, a while after the last click */
const click = (canvas: fabric.Canvas, point: Point) => {
  wait();
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", point));
  document.dispatchEvent(mouseEvent("mouseup", point));
};

/** The second click follows the first at once, where the first was */
const doubleClick = (canvas: fabric.Canvas, point: Point) => {
  click(canvas, point);
  wait(100);
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", point));
  document.dispatchEvent(mouseEvent("mouseup", point));
};

/**
 * A touch event of the page: jsdom cannot build one with touches in it. The
 * finger which changed is `point`, `others` are the fingers which stay down.
 */
const touchEvent = (
  type: string,
  point: Point,
  { id = 0, others = [] as Touch[] } = {}
): Event => {
  const [clientX, clientY] = point;
  const changed = { identifier: id, clientX, clientY } as Touch;
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { value: type === "touchend" ? others : [...others, changed] },
    changedTouches: { value: [changed] },
  });
  return event;
};

const tap = (canvas: fabric.Canvas, point: Point) => {
  wait();
  canvas.upperCanvasEl.dispatchEvent(touchEvent("touchstart", point));
  document.dispatchEvent(touchEvent("touchend", point));
};

const polygons = (canvas: fabric.Canvas) =>
  canvas
    .getObjects()
    .filter((o): o is fabric.Polygon => o instanceof fabric.Polygon);

/**
 * The vertices of the polygon in canvas coordinates: its points are in its own
 * space, which is centered on `pathOffset`, and the matrix of the object puts
 * that space on the canvas.
 */
const vertices = (polygon: fabric.Polygon): Point[] => {
  const matrix = polygon.calcTransformMatrix();
  return polygon.points.map(({ x, y }) => {
    const p = fabric.util.transformPoint(
      new fabric.Point(x - polygon.pathOffset.x, y - polygon.pathOffset.y),
      matrix
    );
    return [Math.round(p.x), Math.round(p.y)];
  });
};

const drawn = (canvas: fabric.Canvas, method: "lineTo" | "moveTo" | "arc") =>
  (canvas.contextTop[method] as jest.Mock).mock.calls;

const keydown = (key: string, target: EventTarget = document) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

/** Three vertices, a triangle which is not closed yet */
const triangle = (canvas: fabric.Canvas) => {
  click(canvas, [100, 100]);
  click(canvas, [200, 100]);
  click(canvas, [150, 180]);
};

describe("Polygon", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is a tool of the component, with the legacy name", () => {
    expect(Tools.Polygon).toEqual(Tool.POLYGON);
    expect(Tool.POLYGON).toEqual("polygon");
  });

  describe("vertices", () => {
    it("places one where the mouse is released, even after a drag", () => {
      const { canvas } = mount();

      canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", [10, 10]));
      document.dispatchEvent(mouseEvent("mousemove", [40, 50]));
      document.dispatchEvent(mouseEvent("mouseup", [40, 50]));
      click(canvas, [200, 100]);
      click(canvas, [150, 180]);
      click(canvas, [40, 50]);

      expect(vertices(polygons(canvas)[0])).toEqual([
        [40, 50],
        [200, 100],
        [150, 180],
      ]);
    });

    it("does not place one for a press which ends outside of the canvas", () => {
      const { canvas } = mount();

      canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", [10, 10]));
      canvas.upperCanvasEl.dispatchEvent(mouseEvent("mouseout", [-5, 10]));
      document.dispatchEvent(mouseEvent("mouseup", [-5, 10]));
      click(canvas, [200, 100]);
      click(canvas, [150, 180]);
      keydown("Enter");

      expect(polygons(canvas)).toHaveLength(0);
    });

    it("are in canvas coordinates, whatever the zoom of the view is", () => {
      const { canvas } = mount();
      canvas.setZoom(2);

      click(canvas, [100, 100]);
      click(canvas, [300, 100]);
      click(canvas, [200, 200]);
      keydown("Enter");

      expect(vertices(polygons(canvas)[0])).toEqual([
        [50, 50],
        [150, 50],
        [100, 100],
      ]);
    });
  });

  describe("preview", () => {
    it("shows the sides placed and the one which follows the pointer, on the top canvas", () => {
      const { canvas } = mount({ lineColor: "#ff0000", lineWidth: 4 });
      const ctx = canvas.contextTop;
      const strokes: [unknown, number][] = [];
      (ctx.stroke as jest.Mock).mockImplementation(() =>
        strokes.push([ctx.strokeStyle, ctx.lineWidth])
      );

      click(canvas, [100, 100]);
      click(canvas, [200, 100]);
      hover(canvas, [150, 180]);

      expect(strokes.at(-1)).toEqual(["#ff0000", 4]);
      expect(drawn(canvas, "moveTo").at(-1)).toEqual([100, 100]);
      expect(drawn(canvas, "lineTo").slice(-2)).toEqual([
        [200, 100],
        [150, 180],
      ]);
      expect(canvas.getObjects()).toHaveLength(0);
    });

    it("has a dot on each vertex", () => {
      const { canvas } = mount();

      click(canvas, [100, 100]);
      click(canvas, [200, 100]);

      const centers = drawn(canvas, "arc").map(([x, y]) => [x, y]);
      expect(centers.slice(-2)).toEqual([
        [100, 100],
        [200, 100],
      ]);
    });

    it("draws again after the canvas renders, which clears its top layer", () => {
      const { canvas } = mount();
      click(canvas, [100, 100]);
      click(canvas, [200, 100]);
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      canvas.renderAll();

      expect(drawn(canvas, "lineTo")).toContainEqual([200, 100]);
    });

    it("follows the pointer on touch only while the finger is down", () => {
      const { canvas } = mount();
      tap(canvas, [100, 100]);
      tap(canvas, [200, 100]);
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      canvas.upperCanvasEl.dispatchEvent(touchEvent("touchstart", [150, 180]));
      document.dispatchEvent(touchEvent("touchmove", [160, 190]));

      expect(drawn(canvas, "lineTo").slice(-2)).toEqual([
        [200, 100],
        [160, 190],
      ]);
      // The vertex is where the finger is lifted
      document.dispatchEvent(touchEvent("touchend", [165, 195]));
      keydown("Enter");
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [165, 195],
      ]);
    });

    it("rings the first vertex when a click there would close the polygon", () => {
      const { canvas } = mount();
      triangle(canvas);
      (canvas.contextTop.arc as jest.Mock).mockClear();

      hover(canvas, [104, 103]);

      // The three dots, then the ring at the first vertex, as wide as the radius
      expect(drawn(canvas, "arc").at(-1)).toEqual([100, 100, 10, 0, Math.PI * 2]);
    });

    it("has no ring far from the first vertex, nor with fewer than three vertices", () => {
      const { canvas } = mount();
      click(canvas, [100, 100]);
      click(canvas, [200, 100]);
      (canvas.contextTop.arc as jest.Mock).mockClear();

      hover(canvas, [101, 101]);
      const two = drawn(canvas, "arc").length;
      click(canvas, [150, 180]);
      (canvas.contextTop.arc as jest.Mock).mockClear();
      hover(canvas, [150, 300]);

      expect(two).toEqual(2);
      expect(drawn(canvas, "arc")).toHaveLength(3);
    });

    it("is gone when the mouse leaves the canvas, and the vertices stay", () => {
      const { canvas } = mount();
      click(canvas, [100, 100]);
      click(canvas, [200, 100]);
      hover(canvas, [150, 180]);
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      canvas.upperCanvasEl.dispatchEvent(mouseEvent("mouseout", [150, 300]));

      expect(drawn(canvas, "lineTo")).toEqual([[200, 100]]);
    });
  });

  describe("closing", () => {
    it("by a click on the first vertex adds one polygon with the vertices", () => {
      const { canvas } = mount();
      triangle(canvas);

      click(canvas, [103, 104]);

      expect(polygons(canvas)).toHaveLength(1);
      expect(canvas.getObjects()).toHaveLength(1);
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
    });

    it("by a click within 10 pixels of the first vertex, and not by one farther", () => {
      const { canvas } = mount();
      triangle(canvas);

      click(canvas, [100, 112]);
      expect(polygons(canvas)).toHaveLength(0);

      click(canvas, [100, 91]);
      expect(polygons(canvas)).toHaveLength(1);
      // The click which closed is not a vertex, the one before it was
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
        [100, 112],
      ]);
    });

    it("by a tap within 20 pixels of the first vertex", () => {
      const { canvas } = mount();
      tap(canvas, [100, 100]);
      tap(canvas, [200, 100]);
      tap(canvas, [150, 180]);

      tap(canvas, [100, 118]);

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
    });

    it("by a double click, with the vertices placed so far", () => {
      const { canvas } = mount();
      triangle(canvas);

      doubleClick(canvas, [250, 250]);

      expect(polygons(canvas)).toHaveLength(1);
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
        [250, 250],
      ]);
    });

    it("by a double tap", () => {
      const { canvas } = mount();
      tap(canvas, [100, 100]);
      tap(canvas, [200, 100]);
      tap(canvas, [150, 180]);
      tap(canvas, [250, 250]);
      wait(100);
      canvas.upperCanvasEl.dispatchEvent(touchEvent("touchstart", [252, 249]));
      document.dispatchEvent(touchEvent("touchend", [252, 249]));

      expect(vertices(polygons(canvas)[0])).toHaveLength(4);
    });

    it("by the Enter key", () => {
      const { canvas } = mount();
      triangle(canvas);

      const event = keydown("Enter");

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
      expect(event.defaultPrevented).toBe(true);
    });

    it("is not by clicks a while apart, or farther apart than a double click", () => {
      const { canvas } = mount();
      triangle(canvas);

      click(canvas, [250, 250]);
      click(canvas, [300, 250]);

      expect(polygons(canvas)).toHaveLength(0);
    });

    it("does nothing with fewer than three vertices", () => {
      const { canvas } = mount();
      click(canvas, [100, 100]);
      doubleClick(canvas, [200, 100]);

      const enter = keydown("Enter");

      expect(polygons(canvas)).toHaveLength(0);
      expect(enter.defaultPrevented).toBe(false);
      // The polygon goes on, a click by the first vertex is a vertex for now
      click(canvas, [101, 101]);
      keydown("Enter");
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [101, 101],
      ]);
    });

    it("lets a self-intersecting polygon be", () => {
      const { canvas } = mount();
      click(canvas, [100, 100]);
      click(canvas, [200, 200]);
      click(canvas, [200, 100]);
      click(canvas, [100, 200]);

      keydown("Enter");

      expect(polygons(canvas)).toHaveLength(1);
      expect(vertices(polygons(canvas)[0])).toHaveLength(4);
    });

    it("leaves the top canvas clean", () => {
      const { canvas } = mount();
      triangle(canvas);
      (canvas.contextTop.clearRect as jest.Mock).mockClear();

      keydown("Enter");

      expect(canvas.contextTop.clearRect).toHaveBeenCalled();
    });

    it("keeps the radius to the first vertex in screen pixels, whatever the zoom", () => {
      const { canvas } = mount();
      canvas.setZoom(2);
      click(canvas, [200, 200]);
      click(canvas, [400, 200]);
      click(canvas, [300, 300]);

      // 12 screen pixels are 6 canvas units, which would be near in canvas units
      click(canvas, [200, 212]);
      expect(polygons(canvas)).toHaveLength(0);

      click(canvas, [200, 190]);
      expect(polygons(canvas)).toHaveLength(1);
    });
  });

  describe("cancelling", () => {
    it("by the Escape key drops the polygon, and nothing is left on the canvas", () => {
      const { sketch, canvas } = mount();
      triangle(canvas);

      const event = keydown("Escape");
      keydown("Enter");

      expect(event.defaultPrevented).toBe(true);
      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
    });

    it("starts the next polygon from nothing", () => {
      const { canvas } = mount();
      triangle(canvas);
      keydown("Escape");

      click(canvas, [300, 300]);
      click(canvas, [400, 300]);
      click(canvas, [350, 380]);
      keydown("Enter");

      expect(vertices(polygons(canvas)[0])).toEqual([
        [300, 300],
        [400, 300],
        [350, 380],
      ]);
    });
  });

  describe("keys", () => {
    it("are listened to only while a polygon is in progress", () => {
      const { canvas } = mount();
      const add = jest.spyOn(document, "addEventListener");
      const remove = jest.spyOn(document, "removeEventListener");
      const keys = (spy: jest.SpyInstance) =>
        spy.mock.calls.filter(([type]) => type === "keydown").length;

      expect(keys(add)).toEqual(0);
      click(canvas, [100, 100]);
      expect(keys(add)).toEqual(1);
      click(canvas, [200, 100]);
      expect(keys(add)).toEqual(1);
      keydown("Escape");
      expect(keys(remove)).toEqual(1);
    });

    it("are left to the fields the user types in", () => {
      const { canvas } = mount();
      const input = document.body.appendChild(document.createElement("input"));
      triangle(canvas);

      const enter = keydown("Enter", input);
      keydown("Escape", input);

      expect(polygons(canvas)).toHaveLength(0);
      expect(enter.defaultPrevented).toBe(false);
      keydown("Enter");
      expect(polygons(canvas)).toHaveLength(1);
      input.remove();
    });
  });

  describe("the polygon", () => {
    it("has the color, the weight and the fill of the line", () => {
      const { canvas } = mount({
        lineColor: "#ff0000",
        lineWidth: 6,
        fillColor: "#00ff00",
      });
      triangle(canvas);
      keydown("Enter");

      const [polygon] = polygons(canvas);
      expect(polygon.stroke).toEqual("#ff0000");
      expect(polygon.strokeWidth).toEqual(6);
      expect(polygon.fill).toEqual("#00ff00");
      expect(polygon.strokeUniform).toBe(true);
    });

    it("is not filled by default, and has the default line of the component", () => {
      const { canvas } = mount();
      triangle(canvas);
      keydown("Enter");

      const [polygon] = polygons(canvas);
      expect(polygon.fill).toEqual("transparent");
      expect(polygon.stroke).toEqual("black");
      expect(polygon.strokeWidth).toEqual(10);
    });

    it("has the color of the line when it is closed, if the line changed on the way", () => {
      const { canvas, rerender } = mount({ lineColor: "#ff0000" });
      click(canvas, [100, 100]);
      click(canvas, [200, 100]);
      rerender(
        <SketchField tool={Tool.POLYGON} lineColor="#0000ff" lineWidth={3} />
      );
      click(canvas, [150, 180]);
      keydown("Enter");

      const [polygon] = polygons(canvas);
      expect(polygon.stroke).toEqual("#0000ff");
      expect(polygon.strokeWidth).toEqual(3);
    });

    it("has its vertices in `points`, in the space of the object", () => {
      const { canvas } = mount();
      triangle(canvas);
      keydown("Enter");

      const [polygon] = polygons(canvas);
      expect(polygon.points.map(({ x, y }) => [x, y])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
      expect(polygon.pathOffset.x).toBeCloseTo(150);
      expect(polygon.pathOffset.y).toBeCloseTo(140);
    });
  });

  describe("in the sketch", () => {
    it("is nothing but the preview until it is closed", () => {
      const onObjectAdded = jest.fn();
      const onChange = jest.fn();
      const { sketch, canvas } = mount({ onObjectAdded, onChange });

      triangle(canvas);
      wait();

      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.toJSON().objects).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
      expect(onObjectAdded).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("is not in the export, and the preview is there after it", () => {
      const { sketch, canvas } = mount();
      triangle(canvas);

      expect(() => sketch.toDataURL()).not.toThrow();

      (canvas.contextTop.lineTo as jest.Mock).mockClear();
      hover(canvas, [150, 300]);
      expect(drawn(canvas, "lineTo").at(-1)).toEqual([150, 300]);
    });

    it("is one undo step, which undo and redo take off and put back", () => {
      const { sketch, canvas } = mount();
      triangle(canvas);
      keydown("Enter");

      expect(sketch.canUndo()).toBe(true);
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
      sketch.redo();
      expect(polygons(canvas)).toHaveLength(1);
      expect(sketch.canRedo()).toBe(false);
    });

    it("calls onObjectAdded once, with the polygon as the target", () => {
      const onObjectAdded = jest.fn();
      const { canvas } = mount({ onObjectAdded });
      triangle(canvas);
      expect(onObjectAdded).not.toHaveBeenCalled();

      click(canvas, [100, 100]);

      expect(onObjectAdded).toHaveBeenCalledTimes(1);
      expect(onObjectAdded.mock.calls[0][0].target).toBe(polygons(canvas)[0]);
    });

    it("calls onChange once, when it is closed, whether by the mouse or by a key", () => {
      const onChange = jest.fn();
      const { canvas } = mount({ onChange });
      triangle(canvas);
      wait();
      expect(onChange).not.toHaveBeenCalled();

      click(canvas, [100, 100]);
      wait();
      expect(onChange).toHaveBeenCalledTimes(1);

      triangle(canvas);
      keydown("Enter");
      wait();
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("does not call onChange for a polygon which is cancelled", () => {
      const onChange = jest.fn();
      const { canvas } = mount({ onChange });
      triangle(canvas);

      keydown("Escape");
      wait();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("still calls onMouseDown and onMouseUp for each click", () => {
      const onMouseDown = jest.fn();
      const onMouseUp = jest.fn();
      const { canvas } = mount({ onMouseDown, onMouseUp });

      triangle(canvas);

      expect(onMouseDown).toHaveBeenCalledTimes(3);
      expect(onMouseUp).toHaveBeenCalledTimes(3);
    });

    it("is saved by toJSON and loaded by fromJSON", async () => {
      const { sketch, canvas } = mount({
        lineColor: "#ff0000",
        fillColor: "#00ff00",
      });
      triangle(canvas);
      keydown("Enter");
      const json = JSON.parse(JSON.stringify(sketch.toJSON()));

      const other = mount({ tool: Tool.SELECT });
      other.sketch.fromJSON(json);
      await waitFor(() => expect(polygons(other.canvas)).toHaveLength(1));

      expect(json.objects[0].type).toEqual("Polygon");
      const [loaded] = polygons(other.canvas);
      expect(vertices(loaded)).toEqual(vertices(polygons(canvas)[0]));
      expect(loaded.stroke).toEqual("#ff0000");
      expect(loaded.fill).toEqual("#00ff00");
    });

    it("can be selected and moved as a whole, once the tool is another", () => {
      const { canvas, rerender } = mount();
      triangle(canvas);
      keydown("Enter");
      const [polygon] = polygons(canvas);
      expect(polygon.selectable).toBe(false);

      rerender(<SketchField tool={Tool.SELECT} />);

      expect(polygon.selectable).toBe(true);
      expect(polygon.evented).toBe(true);
    });

    it("can be cut by the eraser", () => {
      const { canvas } = mount();
      triangle(canvas);
      keydown("Enter");

      expect((polygons(canvas)[0] as { erasable?: boolean }).erasable).toBe(true);
    });
  });

  describe("another tool", () => {
    it("closes the polygon with three vertices, and keeps it", () => {
      const onChange = jest.fn();
      const { sketch, canvas, rerender } = mount({ onChange });
      triangle(canvas);

      rerender(<SketchField tool={Tool.SELECT} onChange={onChange} />);

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
      expect(sketch.canUndo()).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("drops the polygon with fewer vertices", () => {
      const onChange = jest.fn();
      const { canvas, rerender } = mount({ onChange });
      click(canvas, [100, 100]);
      click(canvas, [200, 100]);

      rerender(<SketchField tool={Tool.SELECT} onChange={onChange} />);

      expect(canvas.getObjects()).toHaveLength(0);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("leaves the top canvas clean and the keys alone", () => {
      const { canvas, rerender } = mount();
      triangle(canvas);
      (canvas.contextTop.clearRect as jest.Mock).mockClear();

      rerender(<SketchField tool={Tool.SELECT} />);
      const enter = keydown("Enter");

      expect(canvas.contextTop.clearRect).toHaveBeenCalled();
      expect(enter.defaultPrevented).toBe(false);
      expect(polygons(canvas)).toHaveLength(1);
    });

    it("finds the tool as it was left when it comes back", () => {
      const { canvas, rerender } = mount();
      triangle(canvas);
      rerender(<SketchField tool={Tool.SELECT} />);
      rerender(<SketchField tool={Tool.POLYGON} />);

      click(canvas, [300, 300]);
      click(canvas, [400, 300]);
      click(canvas, [350, 380]);
      keydown("Enter");

      expect(polygons(canvas)).toHaveLength(2);
      expect(vertices(polygons(canvas)[1])).toEqual([
        [300, 300],
        [400, 300],
        [350, 380],
      ]);
    });
  });

  describe("unmounting", () => {
    it("drops the polygon in progress, and its keys", () => {
      const onObjectAdded = jest.fn();
      const onChange = jest.fn();
      const { canvas, unmount } = mount({ onObjectAdded, onChange });
      triangle(canvas);

      unmount();
      const enter = keydown("Enter");
      wait();

      expect(canvas.getObjects()).toHaveLength(0);
      expect(onObjectAdded).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(enter.defaultPrevented).toBe(false);
    });
  });

  describe("a second finger", () => {
    // The canvas does not pass its events on, so it is not a vertex nor a pointer
    it("is not a pointer of the polygon", () => {
      const { canvas } = mount();
      tap(canvas, [100, 100]);
      tap(canvas, [200, 100]);
      wait();
      const first = { identifier: 0, clientX: 150, clientY: 180 } as Touch;

      canvas.upperCanvasEl.dispatchEvent(touchEvent("touchstart", [150, 180]));
      canvas.upperCanvasEl.dispatchEvent(
        touchEvent("touchstart", [300, 300], { id: 1, others: [first] })
      );
      document.dispatchEvent(
        touchEvent("touchend", [300, 300], { id: 1, others: [first] })
      );
      document.dispatchEvent(touchEvent("touchend", [150, 180]));
      keydown("Enter");

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
      ]);
    });
  });
});
