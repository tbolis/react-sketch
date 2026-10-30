import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../../SketchField";
import { SketchProperties, Tool } from "../../../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} tool={Tool.ARROW} {...props} />);
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
  const middle: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  canvas.upperCanvasEl.dispatchEvent(mouseEvent("mousedown", from));
  document.dispatchEvent(mouseEvent("mousemove", middle));
  document.dispatchEvent(mouseEvent("mousemove", to));
  document.dispatchEvent(mouseEvent("mouseup", to));
};

const arrows = (canvas: fabric.Canvas) =>
  canvas.getObjects().filter((o): o is fabric.Group => o instanceof fabric.Group);

/** Where the arrow is: the line and the head move with the group */
const position = (arrow: fabric.Group) => [arrow.left, arrow.top];

describe("Arrow", () => {
  it("is frozen once it is drawn, like the other shapes: it cannot be selected or moved", () => {
    const { canvas } = mount();
    drag(canvas, [100, 100], [300, 100]);

    const [arrow] = arrows(canvas);
    expect(arrow.selectable).toBe(false);
    expect(arrow.evented).toBe(false);
  });

  it("does not select or move an arrow which a new arrow starts on", () => {
    const { canvas } = mount();
    drag(canvas, [100, 100], [300, 100]);
    const [first] = arrows(canvas);
    const before = position(first);

    drag(canvas, [200, 100], [200, 300]);

    expect(canvas.getActiveObject()).toBeUndefined();
    expect(position(first)).toEqual(before);
  });

  it("can start on a previous arrow and cross it", () => {
    const { canvas } = mount();
    drag(canvas, [100, 100], [300, 100]);
    const [first] = arrows(canvas);
    const before = position(first);

    drag(canvas, [200, 50], [200, 150]);
    drag(canvas, [150, 100], [250, 100]);

    const drawn = arrows(canvas);
    expect(drawn).toHaveLength(3);
    expect(position(first)).toEqual(before);
    const [, second, third] = drawn;
    expect(second.getBoundingRect().height).toBeGreaterThan(90);
    expect(third.getBoundingRect().width).toBeGreaterThan(90);
  });

  it("can be selected and moved again with the select tool", () => {
    const { canvas, rerender, sketch } = mount();
    drag(canvas, [100, 100], [300, 100]);
    const [arrow] = arrows(canvas);

    rerender(<SketchField ref={{ current: sketch }} tool={Tool.SELECT} />);

    expect(arrow.selectable).toBe(true);
    expect(arrow.evented).toBe(true);
  });
});
