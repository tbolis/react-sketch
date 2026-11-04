import { createRef } from "react";
import { act, render } from "@testing-library/react";
import * as fabric from "fabric";
import { LaserBrush } from "@react-sketch/laserpointer";
import SketchField from "./SketchField";
import { SketchProperties, Tool } from "../../types";

type Point = [number, number];
interface Finger {
  id: number;
  at: Point;
}

/** What the browser would lay out for the container of the sketch, so the canvas is 800 by 600 */
const layouts: jest.SpyInstance[] = [];
const layout = (width: number, height: number) =>
  layouts.push(
    jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(width),
    jest.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(height)
  );

const mount = (props: SketchProperties = {}) => {
  layout(800, 600);
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return { ...view, sketch, canvas: sketch["canvas"] as fabric.Canvas };
};

/** Let the time pass, so the next tap is not the second of a double tap */
const wait = (ms = 500) => act(() => jest.advanceTimersByTime(ms));

/** A touch event of the page: jsdom cannot build one with touches in it */
const touch = (type: string, changed: Finger[], others: Finger[] = []): Event => {
  const list = (fingers: Finger[]) =>
    fingers.map(({ id, at: [clientX, clientY] }) => ({
      identifier: id,
      clientX,
      clientY,
    }));
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { value: list(type === "touchend" ? others : [...others, ...changed]) },
    changedTouches: { value: list(changed) },
  });
  return event;
};

const finger = (id: number, at: Point): Finger => ({ id, at });

/** The fingers touch the canvas one after the other */
const touchDown = (canvas: fabric.Canvas, fingers: Finger[]) =>
  fingers.forEach((one, i) =>
    canvas.upperCanvasEl.dispatchEvent(
      touch("touchstart", [one], fingers.slice(0, i))
    )
  );

const touchMove = (fingers: Finger[]) =>
  document.dispatchEvent(touch("touchmove", fingers));

/** The fingers leave the screen one after the other */
const touchUp = (fingers: Finger[]) =>
  fingers.forEach((one, i) =>
    document.dispatchEvent(touch("touchend", [one], fingers.slice(i + 1)))
  );

/** Two fingers go from the first places to the second ones, and leave */
const pinch = (canvas: fabric.Canvas, from: [Point, Point], to: [Point, Point]) => {
  const start = from.map((at, id) => finger(id, at));
  const end = to.map((at, id) => finger(id, at));
  touchDown(canvas, start);
  touchMove(end);
  touchUp(end);
};

const tap = (canvas: fabric.Canvas, at: Point) => {
  wait();
  touchDown(canvas, [finger(0, at)]);
  touchUp([finger(0, at)]);
};

const view = (canvas: fabric.Canvas) => [...canvas.viewportTransform];

const keydown = (key: string) =>
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

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

describe("pinch zoom", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    layouts.splice(0).forEach((spy) => spy.mockRestore());
  });

  describe("the view", () => {
    it("zooms about the point between the fingers, which stays under them", () => {
      const { canvas } = mount();

      // The fingers go from 100 apart to 200 apart, around (350, 300)
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );

      expect(view(canvas)).toEqual([2, 0, 0, 2, -350, -300]);
    });

    it("pans when the fingers move together", () => {
      const { canvas } = mount();

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [350, 330],
          [450, 330],
        ]
      );

      expect(view(canvas)).toEqual([1, 0, 0, 1, 50, 30]);
    });

    it("zooms and pans in the same gesture", () => {
      const { canvas } = mount();

      // 100 apart to 200 apart, and the middle goes from (350, 300) to (400, 300)
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [300, 300],
          [500, 300],
        ]
      );

      expect(view(canvas)).toEqual([2, 0, 0, 2, -300, -300]);
    });

    it("goes on from the view it has, with the next gesture", () => {
      const { canvas } = mount();
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );

      // About the same point of the screen again, so the point of the canvas under it stays
      expect(view(canvas)).toEqual([4, 0, 0, 4, -1050, -900]);
    });

    it("keeps the zoom between minZoom and maxZoom, which are 0.5 and 8 by default", () => {
      const { canvas } = mount();

      pinch(
        canvas,
        [
          [390, 300],
          [410, 300],
        ],
        [
          [100, 300],
          [700, 300],
        ]
      );
      expect(canvas.getZoom()).toEqual(8);

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      pinch(
        canvas,
        [
          [100, 300],
          [700, 300],
        ],
        [
          [395, 300],
          [405, 300],
        ]
      );
      expect(canvas.getZoom()).toEqual(0.5);
    });

    it("keeps the zoom between the minZoom and maxZoom which are given", () => {
      const { canvas } = mount({ minZoom: 1, maxZoom: 3 });

      pinch(
        canvas,
        [
          [390, 300],
          [410, 300],
        ],
        [
          [100, 300],
          [700, 300],
        ]
      );
      expect(canvas.getZoom()).toEqual(3);

      pinch(
        canvas,
        [
          [100, 300],
          [700, 300],
        ],
        [
          [395, 300],
          [405, 300],
        ]
      );
      expect(canvas.getZoom()).toEqual(1);
    });

    it("cannot take the canvas out of sight", () => {
      const { canvas } = mount();

      // The fingers go far to the right and down: a quarter of the 600 pixels stays
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [1000, 800],
          [1100, 800],
        ]
      );

      expect(view(canvas)).toEqual([1, 0, 0, 1, 650, 450]);
    });

    it("does nothing with one finger, nor when pinchZoom is off", () => {
      const first = mount();
      touchDown(first.canvas, [finger(0, [300, 300])]);
      touchMove([finger(0, [400, 400])]);
      touchUp([finger(0, [400, 400])]);
      expect(view(first.canvas)).toEqual([1, 0, 0, 1, 0, 0]);
      first.unmount();

      const { canvas } = mount({ pinchZoom: false });
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      expect(view(canvas)).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it("is told to onViewChange as it changes, and by resetView()", () => {
      const onViewChange = jest.fn();
      const { sketch, canvas } = mount({ onViewChange });

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      expect(onViewChange).toHaveBeenLastCalledWith({ zoom: 2, x: -350, y: -300 });

      sketch.resetView();
      expect(view(canvas)).toEqual([1, 0, 0, 1, 0, 0]);
      expect(onViewChange).toHaveBeenLastCalledWith({ zoom: 1, x: 0, y: 0 });
    });

    it("is not saved, not undone, and does not change what the sketch tells", () => {
      const onChange = jest.fn();
      const onObjectAdded = jest.fn();
      const onObjectModified = jest.fn();
      const { sketch, canvas } = mount({
        onChange,
        onObjectAdded,
        onObjectModified,
      });
      canvas.add(new fabric.Rect({ left: 10, top: 20, width: 100, height: 50 }));
      const before = JSON.stringify(sketch.toJSON());
      const undoable = sketch.canUndo();

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      wait();

      expect(JSON.stringify(sketch.toJSON())).toEqual(before);
      expect(sketch.canUndo()).toBe(undoable);
      expect(onChange).not.toHaveBeenCalled();
      expect(onObjectModified).not.toHaveBeenCalled();
      expect(canvas.getObjects()[0].left).toEqual(10);
    });

    it("is not in the image of toDataURL, and is there again after it", () => {
      const { sketch, canvas } = mount();
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      const seen: number[][] = [];
      const spy = jest
        .spyOn(HTMLCanvasElement.prototype, "toDataURL")
        .mockImplementation(() => {
          seen.push([...canvas.viewportTransform]);
          return "data:,";
        });

      sketch.toDataURL();
      spy.mockRestore();

      expect(seen).toEqual([[1, 0, 0, 1, 0, 0]]);
      expect(view(canvas)).toEqual([2, 0, 0, 2, -350, -300]);
    });

    it("stops listening when the component is unmounted", () => {
      const { canvas, unmount } = mount();
      const upper = canvas.upperCanvasEl;
      unmount();

      upper.dispatchEvent(touch("touchstart", [finger(0, [300, 300])]));
      upper.dispatchEvent(touch("touchstart", [finger(1, [400, 300])]));
      touchMove([finger(0, [250, 300]), finger(1, [450, 300])]);
      touchUp([finger(0, [250, 300]), finger(1, [450, 300])]);

      expect(view(canvas)).toEqual([1, 0, 0, 1, 0, 0]);
    });
  });

  describe("a stroke which the first finger started", () => {
    it("is dropped when the second finger comes: a line leaves no object nor undo step", () => {
      const { sketch, canvas } = mount({ tool: Tool.LINE });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchMove([finger(0, [160, 140])]);
      expect(canvas.getObjects()).toHaveLength(1);

      touchDown(canvas, [finger(1, [300, 300])]);
      touchMove([finger(0, [170, 150]), finger(1, [320, 320])]);
      touchUp([finger(0, [170, 150]), finger(1, [320, 320])]);

      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
    });

    it.each([
      ["an arrow", Tool.ARROW],
      ["a rectangle", Tool.RECTANGLE],
      ["a circle", Tool.CIRCLE],
      ["a rectangle with a label", Tool.RECTANGLE_LABEL],
    ])("is dropped for %s too", (_name, tool) => {
      const { sketch, canvas } = mount({ tool });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchMove([finger(0, [160, 140])]);

      touchDown(canvas, [finger(1, [300, 300])]);
      touchMove([finger(0, [170, 150]), finger(1, [320, 320])]);
      touchUp([finger(0, [170, 150]), finger(1, [320, 320])]);

      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
    });

    it("is dropped for a free line of the pencil, and nothing is drawn after it", () => {
      const { sketch, canvas } = mount({ tool: Tool.PENCIL });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchMove([finger(0, [120, 120])]);
      touchMove([finger(0, [140, 150])]);

      touchDown(canvas, [finger(1, [300, 300])]);
      touchMove([finger(0, [170, 150]), finger(1, [320, 320])]);
      touchUp([finger(0, [170, 150]), finger(1, [320, 320])]);

      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
    });

    it("does not erase with the eraser", async () => {
      const { canvas } = mount({ tool: Tool.ERASER, lineWidth: 20 });
      const rect = new fabric.Rect({
        left: 50,
        top: 50,
        width: 200,
        height: 100,
        fill: "red",
      });
      canvas.add(rect);
      touchDown(canvas, [finger(0, [60, 100])]);
      touchMove([finger(0, [150, 100])]);

      touchDown(canvas, [finger(1, [300, 300])]);
      touchMove([finger(0, [240, 100]), finger(1, [320, 320])]);
      touchUp([finger(0, [240, 100]), finger(1, [320, 320])]);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(50);
      });

      expect(rect.clipPath).toBeUndefined();
    });

    it("does not hold the laser line, which fades", () => {
      const { canvas } = mount({ tool: Tool.LASER_POINTER });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchMove([finger(0, [160, 140])]);
      const brush = canvas.freeDrawingBrush as LaserBrush;
      const trails = () =>
        (brush as unknown as { trails: { held: boolean }[] }).trails;
      expect(trails().some((trail) => trail.held)).toBe(true);

      touchDown(canvas, [finger(1, [300, 300])]);

      expect(trails().some((trail) => trail.held)).toBe(false);
    });

    it("is kept when it was finished before: the lines drawn are objects of the sketch", () => {
      const { sketch, canvas } = mount({ tool: Tool.LINE });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchMove([finger(0, [160, 140])]);
      touchUp([finger(0, [160, 140])]);

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );

      expect(canvas.getObjects()).toHaveLength(1);
      expect(sketch.canUndo()).toBe(true);
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
    });

    it("does not leave a stroke on the next one", () => {
      const { sketch, canvas } = mount({ tool: Tool.LINE });
      touchDown(canvas, [finger(0, [100, 100])]);
      touchDown(canvas, [finger(1, [300, 300])]);
      touchUp([finger(0, [100, 100]), finger(1, [300, 300])]);

      wait();
      touchDown(canvas, [finger(0, [200, 200])]);
      touchMove([finger(0, [260, 240])]);
      touchUp([finger(0, [260, 240])]);

      expect(canvas.getObjects()).toHaveLength(1);
      expect(sketch.canUndo()).toBe(true);
    });
  });

  /**
   * The vertices of the polygon in progress are in canvas coordinates, so the
   * view can change while it is drawn.
   */
  describe("in the middle of a polygon", () => {
    const polygons = (canvas: fabric.Canvas) =>
      canvas
        .getObjects()
        .filter((o): o is fabric.Polygon => o instanceof fabric.Polygon);

    /** Two vertices placed, the tool is the polygon */
    const started = () => {
      const onObjectAdded = jest.fn();
      const onChange = jest.fn();
      const view = mount({ tool: Tool.POLYGON, onObjectAdded, onChange });
      tap(view.canvas, [100, 100]);
      tap(view.canvas, [300, 100]);
      return { ...view, onObjectAdded, onChange };
    };

    it("keeps the vertices placed, and the next ones are placed in the new view", () => {
      const { canvas } = started();

      // A zoom of 2 about (350, 300), the middle of the fingers
      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      expect(view(canvas)).toEqual([2, 0, 0, 2, -350, -300]);
      tap(canvas, [300, 400]);
      keydown("Enter");

      // The screen point (300, 400) is the canvas point ((300 + 350) / 2, (400 + 300) / 2)
      expect(vertices(polygons(canvas)[0])).toEqual([
        [100, 100],
        [300, 100],
        [325, 350],
      ]);
    });

    it("does not place a vertex where the fingers were, nor when they leave", () => {
      const { canvas, onObjectAdded } = started();

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      keydown("Enter");

      // Two vertices only: Enter closes nothing
      expect(polygons(canvas)).toHaveLength(0);
      expect(onObjectAdded).not.toHaveBeenCalled();
    });

    it("draws the preview in the new view, from the same vertices", () => {
      const { canvas } = started();
      (canvas.contextTop.lineTo as jest.Mock).mockClear();

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      // The canvas renders on the next frame
      wait(50);

      expect((canvas.contextTop.lineTo as jest.Mock).mock.calls.at(-1)).toEqual([
        300, 100,
      ]);
      expect((canvas.contextTop.transform as jest.Mock).mock.calls.at(-1)).toEqual([
        2, 0, 0, 2, -350, -300,
      ]);
    });

    it("goes on when the fingers come while one of them was about to place a vertex", () => {
      const { canvas } = started();
      wait();

      // The first finger is down where a vertex would be placed, the second finger comes
      touchDown(canvas, [finger(0, [200, 250])]);
      touchDown(canvas, [finger(1, [260, 250])]);
      touchMove([finger(0, [180, 250]), finger(1, [280, 250])]);
      touchUp([finger(0, [180, 250]), finger(1, [280, 250])]);
      tap(canvas, [200, 200]);
      keydown("Enter");

      const [polygon] = polygons(canvas);
      expect(polygon.points).toHaveLength(3);
      expect(vertices(polygon).slice(0, 2)).toEqual([
        [100, 100],
        [300, 100],
      ]);
    });

    it("is one undo step and one onChange when it is closed after the view changed", () => {
      const { sketch, canvas, onObjectAdded, onChange } = started();

      pinch(
        canvas,
        [
          [300, 300],
          [400, 300],
        ],
        [
          [250, 300],
          [450, 300],
        ]
      );
      tap(canvas, [300, 400]);
      keydown("Enter");
      wait();

      expect(onObjectAdded).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
    });
  });
});
