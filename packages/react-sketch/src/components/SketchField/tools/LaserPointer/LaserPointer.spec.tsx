import { createRef } from "react";
import { act, render } from "@testing-library/react";
import * as fabric from "fabric";
import { LaserBrush } from "@react-sketch/laserpointer";
import SketchField from "../../SketchField";
import { SketchProperties, Tool, Tools } from "../../../../types";

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(
    <SketchField ref={ref} tool={Tool.LASER_POINTER} {...props} />
  );
  const sketch = ref.current as SketchField;
  const canvas = sketch["canvas"] as fabric.Canvas;
  return {
    ...view,
    sketch,
    canvas,
    brush: () => canvas.freeDrawingBrush as LaserBrush,
  };
};

type Point = [number, number];

const at = ([x, y]: Point) => new fabric.Point(x, y);
const event = (type: string) => ({ e: new MouseEvent(type) }) as never;
const down = (brush: LaserBrush, point: Point) =>
  brush.onMouseDown(at(point), event("mousedown"));
const move = (brush: LaserBrush, point: Point) =>
  brush.onMouseMove(at(point), event("mousemove"));
const up = (brush: LaserBrush) => brush.onMouseUp(event("mouseup"));

/** Let the time pass, frame by frame as the animation runs */
const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

const inside = (brush: LaserBrush) =>
  brush as unknown as {
    trails: { points: unknown[]; held: boolean }[];
    frame?: number;
  };
const trails = (brush: LaserBrush) => inside(brush).trails;

describe("LaserPointer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is a tool of the component, with the legacy name", () => {
    expect(Tools.LaserPointer).toEqual(Tool.LASER_POINTER);
  });

  it("draws with a laser brush of the color and the width of the line", () => {
    const { canvas } = mount({ lineColor: "#ff0000", lineWidth: 8 });

    expect(canvas.isDrawingMode).toBe(true);
    expect(canvas.freeDrawingBrush).toBeInstanceOf(LaserBrush);
    expect(canvas.freeDrawingBrush?.color).toEqual("#ff0000");
    expect(canvas.freeDrawingBrush?.width).toEqual(8);
  });

  it("follows the line color and width when they change", () => {
    const { canvas, rerender } = mount({ lineColor: "#ff0000", lineWidth: 8 });
    const brush = canvas.freeDrawingBrush;

    rerender(
      <SketchField tool={Tool.LASER_POINTER} lineColor="#00ff00" lineWidth={3} />
    );

    expect(canvas.freeDrawingBrush).toBe(brush);
    expect(brush?.color).toEqual("#00ff00");
    expect(brush?.width).toEqual(3);
  });

  it("glows in its color", () => {
    const { canvas } = mount({ lineColor: "#ff0000", lineWidth: 8 });

    expect(canvas.freeDrawingBrush?.shadow?.color).toEqual("#ff0000");
    expect(canvas.freeDrawingBrush?.shadow?.blur).toBeGreaterThan(0);
  });

  describe("a line", () => {
    it("is drawn on the top canvas while the pointer moves", async () => {
      const { canvas, brush } = mount({ lineWidth: 10 });

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      await wait(16);

      expect(canvas.contextTop.fill).toHaveBeenCalled();
      expect(canvas.contextTop.clearRect).toHaveBeenCalled();
    });

    it("is thinner towards its start", async () => {
      const { canvas, brush } = mount({ lineWidth: 10 });
      const arc = canvas.contextTop.arc as jest.Mock;

      down(brush(), [10, 10]);
      await wait(200);
      move(brush(), [60, 40]);
      await wait(200);
      move(brush(), [90, 20]);
      arc.mockClear();
      await wait(16);

      const [start, middle, head] = arc.mock.calls.map(([, , radius]) => radius);
      // The head is as fresh as the pointer is, so it has the full width
      expect(head).toEqual(5);
      expect(middle).toBeLessThan(head);
      expect(start).toBeLessThan(middle);
      expect(start).toBeGreaterThan(0);
    });

    it("is not an object of the sketch", async () => {
      const onObjectAdded = jest.fn();
      const { sketch, canvas, brush } = mount({ onObjectAdded });

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      move(brush(), [90, 20]);
      up(brush());
      await wait(16);

      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.toJSON().objects).toEqual([]);
      expect(sketch.canUndo()).toBe(false);
      expect(onObjectAdded).not.toHaveBeenCalled();
    });

    it("keeps the objects as they were", async () => {
      const { sketch, canvas, brush } = mount();
      const rect = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50 });
      canvas.add(rect);
      const before = JSON.stringify(sketch.toJSON());

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      up(brush());
      await wait(2000);

      expect(JSON.stringify(sketch.toJSON())).toEqual(before);
      expect(canvas.getObjects()).toEqual([rect]);
    });

    it("does not tell the application that the sketch changed", async () => {
      const onChange = jest.fn();
      const onMouseUp = jest.fn();
      const { canvas } = mount({ onChange, onMouseUp });
      const fire = (name: string) =>
        (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, {
          e: new MouseEvent(name),
        });

      fire("mouse:up");
      fire("mouse:out");
      await wait(50);

      expect(onMouseUp).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("is gone after its duration", async () => {
      const { canvas, brush } = mount({ lineWidth: 10 });

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      up(brush());
      await wait(500);
      expect(trails(brush())).toHaveLength(1);

      await wait(600);
      expect(trails(brush())).toHaveLength(0);
      // The top canvas is cleared, nothing is left on it
      const clear = canvas.contextTop.clearRect as jest.Mock;
      expect(clear).toHaveBeenCalled();
    });

    it("fades for as long as the duration is", async () => {
      const { brush } = mount();
      brush().duration = 200;

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      up(brush());
      await wait(100);
      expect(trails(brush())).toHaveLength(1);

      await wait(150);
      expect(trails(brush())).toHaveLength(0);
    });

    it("keeps its head while the pointer is down, even when it does not move", async () => {
      const { brush } = mount();

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      await wait(3000);

      expect(trails(brush())).toHaveLength(1);
      expect(trails(brush())[0].points).toHaveLength(1);

      up(brush());
      await wait(1100);
      expect(trails(brush())).toHaveLength(0);
    });

    it("is one line for each drag, and they fade on their own", async () => {
      const { brush } = mount();

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      up(brush());
      await wait(600);
      down(brush(), [100, 100]);
      move(brush(), [160, 140]);
      up(brush());
      expect(trails(brush())).toHaveLength(2);

      await wait(500);
      expect(trails(brush())).toHaveLength(1);
    });

    it("ignores a move shorter than a pixel", () => {
      const { brush } = mount();

      down(brush(), [10, 10]);
      move(brush(), [10.4, 10.4]);

      expect(trails(brush())[0].points).toHaveLength(1);
    });

    it("is a dot when the pointer does not move", async () => {
      const { canvas, brush } = mount({ lineWidth: 10 });
      const arc = canvas.contextTop.arc as jest.Mock;

      down(brush(), [10, 10]);
      up(brush());
      arc.mockClear();
      await wait(16);

      expect(arc).toHaveBeenCalledTimes(1);
      expect(arc.mock.calls[0].slice(0, 2)).toEqual([10, 10]);
    });

    it("is not started by a secondary touch", () => {
      const { brush } = mount();

      brush().onMouseDown(at([10, 10]), {
        e: { isPrimary: false } as PointerEvent,
      } as never);

      expect(trails(brush())).toHaveLength(0);
    });

    it("stops the animation when nothing is left to show", async () => {
      const { brush } = mount();

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      up(brush());
      await wait(1100);

      expect(jest.getTimerCount()).toEqual(0);
    });
  });

  describe("another tool", () => {
    it("takes over without the line, which is gone with the laser pointer", async () => {
      const { canvas, brush, rerender } = mount();
      const laser = brush();

      down(laser, [10, 10]);
      move(laser, [60, 40]);
      rerender(<SketchField tool={Tool.PENCIL} />);

      expect(trails(laser)).toHaveLength(0);
      expect(inside(laser).frame).toBeUndefined();
      expect(canvas.freeDrawingBrush).toBeInstanceOf(fabric.PencilBrush);
    });

    it("gets a brush of its own, for the eraser too", () => {
      const { canvas, rerender } = mount();

      rerender(<SketchField tool={Tool.ERASER} />);

      expect(canvas.freeDrawingBrush).not.toBeInstanceOf(LaserBrush);
      expect(canvas.freeDrawingBrush).toBeDefined();
    });

    it("is not drawn on, when the tool does not draw", () => {
      const { canvas, rerender } = mount();

      rerender(<SketchField tool={Tool.SELECT} />);

      expect(canvas.freeDrawingBrush).toBeUndefined();
      expect(canvas.isDrawingMode).toBe(false);
    });

    it("gives the laser pointer a new brush when it comes back", () => {
      const { canvas, rerender } = mount();
      const first = canvas.freeDrawingBrush;

      rerender(<SketchField tool={Tool.SELECT} />);
      rerender(<SketchField tool={Tool.LASER_POINTER} />);

      expect(canvas.freeDrawingBrush).toBeInstanceOf(LaserBrush);
      expect(canvas.freeDrawingBrush).not.toBe(first);
    });
  });

  describe("the component", () => {
    it("stops the animation when it is unmounted", async () => {
      const { brush, unmount } = mount();

      down(brush(), [10, 10]);
      move(brush(), [60, 40]);
      await wait(16);
      unmount();

      expect(jest.getTimerCount()).toEqual(0);
    });

    it("does not draw on a canvas which is disposed", async () => {
      const { canvas, brush } = mount();
      const laser = brush();

      down(laser, [10, 10]);
      move(laser, [60, 40]);
      // Disposing the canvas without telling the tool, as a caller of the brush could
      void canvas.dispose();

      await expect(wait(100)).resolves.not.toThrow();
      expect(trails(laser)).toHaveLength(0);
    });
  });
});
