import { createRef } from "react";
import { act, render, waitFor } from "@testing-library/react";
import * as fabric from "fabric";
import { EraserBrush } from "@react-sketch/eraser";
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

/** Press the mouse at `from`, drag it to `to` and release it, on the canvas */
const drag = (canvas: fabric.Canvas, from: Point, to: Point) => {
  const middle: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", from));
  document.dispatchEvent(mouseEvent("mousemove", middle));
  document.dispatchEvent(mouseEvent("mousemove", to));
  document.dispatchEvent(mouseEvent("mouseup", to));
};

/** Erase with one stroke from `from` to `to`, and wait for it to be committed */
const erase = async (canvas: fabric.Canvas, from: Point, to: Point) => {
  const brush = canvas.freeDrawingBrush as EraserBrush;
  const event = (type: string) => ({ e: new MouseEvent(type) }) as never;
  brush.onMouseDown(new fabric.Point(...from), event("mousedown"));
  brush.onMouseMove(new fabric.Point(...to), event("mousemove"));
  brush.onMouseUp(event("mouseup"));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(20);
  });
};

/**
 * What the export of the sketch draws: the canvas element which `toDataURL()`
 * turns into the image, and the kinds of drawing it received.
 */
const exported = (sketch: SketchField): string[] => {
  const spy = jest
    .spyOn(HTMLCanvasElement.prototype, "toDataURL")
    .mockImplementation(() => "data:,");
  let image: HTMLCanvasElement;
  try {
    sketch.toDataURL();
    [image] = spy.mock.contexts as HTMLCanvasElement[];
  } finally {
    spy.mockRestore();
  }
  const context = image.getContext("2d") as unknown as {
    __getDrawCalls(): { type: string }[];
  };
  return context.__getDrawCalls().map(({ type }) => type);
};

/** The lengths of the sides of the polygon, which do not change when it is moved or rotated */
const sides = (polygon: fabric.Polygon): number[] => {
  const points = vertices(polygon);
  return points.map(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return Math.hypot(nx - x, ny - y);
  });
};

/** The spies of the layout of the container, which the test restores when it ends */
const layouts: jest.SpyInstance[] = [];

/** What the browser would lay out for the container of the sketch */
const layout = (width: number, height: number) =>
  layouts.push(
    jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(width),
    jest.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(height)
  );

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
    layouts.splice(0).forEach((spy) => spy.mockRestore());
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

    it("is not in the export until it is closed, and the preview is there after it", () => {
      const { sketch, canvas } = mount();
      triangle(canvas);
      hover(canvas, [150, 300]);

      // Nothing is drawn but the background: an object is drawn from its own cache (drawImage)
      const before = exported(sketch);
      expect(before).not.toContain("drawImage");
      expect(before).not.toContain("stroke");
      (canvas.contextTop.lineTo as jest.Mock).mockClear();
      hover(canvas, [160, 310]);
      expect(drawn(canvas, "lineTo").at(-1)).toEqual([160, 310]);

      keydown("Enter");
      expect(exported(sketch)).toContain("drawImage");
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

    describe("with the select tool", () => {
      /** A closed triangle, and the select tool in use */
      const closedTriangle = () => {
        const view = mount();
        triangle(view.canvas);
        keydown("Enter");
        view.rerender(<SketchField tool={Tool.SELECT} />);
        return { ...view, polygon: polygons(view.canvas)[0] };
      };

      it("moves as a whole when it is dragged, and the move can be undone", () => {
        const { sketch, canvas, polygon } = closedTriangle();
        const before = vertices(polygon);

        drag(canvas, [150, 140], [190, 160]);

        expect(canvas.getActiveObject()).toBe(polygon);
        expect(vertices(polygon)).toEqual(before.map(([x, y]) => [x + 40, y + 20]));
        sketch.undo();
        expect(vertices(polygon)).toEqual(before);
      });

      it("scales as a whole when a corner is dragged", () => {
        const { canvas, polygon } = closedTriangle();
        drag(canvas, [150, 140], [150, 140]);
        const before = sides(polygon);
        const { x, y } = polygon.oCoords.br;

        drag(canvas, [x, y], [x + 60, y + 60]);

        const ratios = sides(polygon).map((side, i) => side / before[i]);
        expect(ratios[0]).toBeGreaterThan(1.1);
        ratios.forEach((ratio) => expect(ratio).toBeCloseTo(ratios[0], 1));
      });

      it("rotates as a whole when its handle is dragged", () => {
        const { canvas, polygon } = closedTriangle();
        drag(canvas, [150, 140], [150, 140]);
        const before = sides(polygon);
        const beforeVertices = vertices(polygon);
        const center = polygon.getCenterPoint();
        const { x, y } = polygon.oCoords.mtr;
        // The handle goes a quarter of a turn around the center
        const to: Point = [center.x - (y - center.y), center.y + (x - center.x)];

        drag(canvas, [x, y], to);

        expect(Math.abs(polygon.angle)).toBeGreaterThan(45);
        expect(vertices(polygon)).not.toEqual(beforeVertices);
        sides(polygon).forEach((side, i) => expect(side).toBeCloseTo(before[i], 0));
      });
    });

    describe("with the eraser", () => {
      it("is cut where a stroke crosses it, and the cut is saved and can be undone", async () => {
        const { sketch, canvas, rerender } = mount();
        triangle(canvas);
        keydown("Enter");
        const [polygon] = polygons(canvas);
        rerender(<SketchField tool={Tool.ERASER} lineWidth={20} />);

        await erase(canvas, [90, 130], [210, 130]);

        expect(polygon.clipPath?.type).toEqual("clipping");
        expect(
          (sketch.toJSON().objects as { clipPath?: { type: string } }[])[0].clipPath
            ?.type
        ).toEqual("clipping");
        sketch.undo();
        expect(polygon.clipPath).toBeUndefined();
        expect(polygons(canvas)).toHaveLength(1);
        sketch.redo();
        expect(polygon.clipPath?.type).toEqual("clipping");
      });

      it("is not cut by a stroke which misses it", async () => {
        const { canvas, rerender } = mount();
        triangle(canvas);
        keydown("Enter");
        const [polygon] = polygons(canvas);
        rerender(<SketchField tool={Tool.ERASER} lineWidth={20} />);

        await erase(canvas, [300, 400], [400, 400]);

        expect(polygon.clipPath).toBeUndefined();
      });
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

  /**
   * A pinch zoom moves the view of the canvas (its viewport transform), the
   * objects stay where they are. The vertices are in canvas coordinates, so
   * the view can change in the middle of a polygon.
   */
  describe("when the view changes on the way", () => {
    /** Two vertices at the first view, which are (100, 100) and (200, 100) */
    const started = () => {
      const view = mount();
      click(view.canvas, [100, 100]);
      click(view.canvas, [200, 100]);
      return view;
    };

    it("keeps the vertices placed, and places the next in the new view, when it zooms", () => {
      const { canvas } = started();

      // The zoom is about the point (150, 100) of the canvas, which stays where it is on the screen
      canvas.zoomToPoint(new fabric.Point(150, 100), 2);
      canvas.renderAll();
      click(canvas, [150, 180]);
      keydown("Enter");

      expect(canvas.getZoom()).toEqual(2);
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 140],
      ]);
    });

    it("keeps the vertices placed, and places the next in the new view, when it pans", () => {
      const { canvas } = started();

      canvas.relativePan(new fabric.Point(30, 40));
      canvas.renderAll();
      click(canvas, [150, 180]);
      keydown("Enter");

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [120, 140],
      ]);
    });

    it("draws the preview in the new view, from the same vertices", () => {
      const { canvas } = started();
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      canvas.zoomToPoint(new fabric.Point(150, 100), 2);
      canvas.renderAll();

      // The sides keep their canvas coordinates, and the context carries the zoom
      expect(drawn(canvas, "lineTo").at(-1)).toEqual([200, 100]);
      expect((canvas.contextTop.transform as jest.Mock).mock.calls.at(-1)).toEqual([
        2, 0, 0, 2, -150, -100,
      ]);
    });

    it("follows the pointer in the new view", () => {
      const { canvas } = started();
      canvas.zoomToPoint(new fabric.Point(150, 100), 2);
      canvas.renderAll();
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      hover(canvas, [150, 180]);

      expect(drawn(canvas, "lineTo").slice(-2)).toEqual([
        [200, 100],
        [150, 140],
      ]);
    });

    it("closes by the first vertex within 10 screen pixels of it in the new view", () => {
      const { canvas } = started();
      click(canvas, [150, 180]);

      canvas.setZoom(2);
      canvas.renderAll();
      // The first vertex is at (200, 200) of the screen now
      click(canvas, [200, 212]);
      expect(polygons(canvas)).toHaveLength(0);
      click(canvas, [200, 192]);

      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [200, 100],
        [150, 180],
        [100, 106],
      ]);
    });
  });

  /**
   * `zoom()` and the resize of the canvas scale the objects, so they scale the
   * polygon in progress too: it is closed where the objects of the sketch are.
   */
  describe("when the sketch is scaled on the way", () => {
    /** A polygon which is closed, and another one with two vertices placed */
    const started = () => {
      const view = mount();
      triangle(view.canvas);
      keydown("Enter");
      click(view.canvas, [300, 300]);
      click(view.canvas, [400, 300]);
      return view;
    };

    it("follows the objects when zoom() is called", () => {
      const { sketch, canvas } = started();

      sketch.zoom(2);
      click(canvas, [700, 640]);
      keydown("Enter");

      const [closed, other] = polygons(canvas);
      expect(vertices(closed)).toEqual([
        [200, 200],
        [400, 200],
        [300, 360],
      ]);
      expect(vertices(other)).toEqual([
        [600, 600],
        [800, 600],
        [700, 640],
      ]);
    });

    it("draws the preview at the new size", () => {
      const { sketch, canvas } = started();
      hover(canvas, [350, 350]);
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      sketch.zoom(2);

      expect(drawn(canvas, "lineTo").slice(-2)).toEqual([
        [800, 600],
        [700, 700],
      ]);
    });

    it("follows the objects when the canvas is resized with the window", () => {
      const { canvas } = started();
      // The container is twice as wide and three times as high
      layout(canvas.getWidth() * 2, canvas.getHeight() * 3);

      window.dispatchEvent(new Event("resize"));
      click(canvas, [700, 1500]);
      keydown("Enter");

      const [closed, other] = polygons(canvas);
      expect(vertices(closed)).toEqual([
        [200, 300],
        [400, 300],
        [300, 540],
      ]);
      expect(vertices(other)).toEqual([
        [600, 900],
        [800, 900],
        [700, 1500],
      ]);
    });

    it("is left alone by a resize which changes nothing", () => {
      const { canvas } = started();

      // The container has no size to fit to, as when it is hidden
      window.dispatchEvent(new Event("resize"));
      click(canvas, [350, 380]);
      keydown("Enter");

      expect(vertices(polygons(canvas)[1])).toEqual([
        [300, 300],
        [400, 300],
        [350, 380],
      ]);
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
