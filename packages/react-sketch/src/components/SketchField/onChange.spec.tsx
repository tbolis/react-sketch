import { act, render } from "@testing-library/react";
import SketchField from "./SketchField";
import { SketchProperties, Tool } from "../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  let current = props;
  const view = render(<SketchField {...current} />);
  const canvasEl = view.container.querySelector(
    "canvas.upper-canvas"
  ) as HTMLElement;
  return {
    ...view,
    upper: canvasEl,
    /** The same sketch, with other properties */
    use: (next: SketchProperties) => {
      current = { ...current, ...next };
      view.rerender(<SketchField {...current} />);
    },
  };
};

const mouseEvent = (type: string, [x, y]: Point): MouseEvent =>
  new MouseEvent(type, {
    clientX: x,
    clientY: y,
    buttons: type === "mouseup" ? 0 : 1,
    bubbles: true,
    cancelable: true,
  });

const wait = (ms = 20) => act(() => jest.advanceTimersByTime(ms));

/** Press the mouse at `from`, drag it to `to` and release it, as the browser tells the canvas */
const drag = (upper: HTMLElement, from: Point, to: Point) => {
  upper.dispatchEvent(mouseEvent("mousedown", from));
  document.dispatchEvent(
    mouseEvent("mousemove", [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2])
  );
  document.dispatchEvent(mouseEvent("mousemove", to));
  document.dispatchEvent(mouseEvent("mouseup", to));
};

describe("onChange, with the events of the browser", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is called for a drawing, and for the move of it with the select tool", () => {
    const onChange = jest.fn();
    const { upper, use } = mount({ tool: Tool.RECTANGLE, onChange });

    drag(upper, [100, 100], [200, 160]);
    wait();
    expect(onChange).toHaveBeenCalledTimes(1);

    use({ tool: Tool.SELECT });
    drag(upper, [150, 130], [170, 150]);
    wait();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("is not called for a click which selects, for a drag in the empty part, or for a pointer which leaves", () => {
    const onChange = jest.fn();
    const { upper, use } = mount({ tool: Tool.RECTANGLE, onChange });
    drag(upper, [100, 100], [200, 160]);
    wait();
    onChange.mockClear();
    use({ tool: Tool.SELECT });

    // Selects the rectangle, and moves nothing
    upper.dispatchEvent(mouseEvent("mousedown", [150, 130]));
    document.dispatchEvent(mouseEvent("mouseup", [150, 130]));
    // A drag in the part with nothing in it
    drag(upper, [400, 400], [450, 450]);
    // The pointer comes and goes
    upper.dispatchEvent(mouseEvent("mouseout", [450, 450]));
    wait(1000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("is called once for a drawing which the mouse leaves the canvas in the middle of", () => {
    const onChange = jest.fn();
    const { upper } = mount({ tool: Tool.LINE, onChange });

    upper.dispatchEvent(mouseEvent("mousedown", [100, 100]));
    document.dispatchEvent(mouseEvent("mousemove", [150, 120]));
    upper.dispatchEvent(mouseEvent("mouseout", [150, 120]));
    wait();
    expect(onChange).toHaveBeenCalledTimes(1);

    document.dispatchEvent(mouseEvent("mouseup", [300, 300]));
    wait(1000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is called for a free stroke of the pencil", () => {
    const onChange = jest.fn();
    const { upper } = mount({ tool: Tool.PENCIL, onChange });

    drag(upper, [100, 100], [200, 160]);
    wait();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is not called for the press and release of a tool which draws nothing, the pan tool", () => {
    const onChange = jest.fn();
    const { upper } = mount({ tool: Tool.PAN, onChange });

    drag(upper, [100, 100], [200, 160]);
    wait(1000);

    expect(onChange).not.toHaveBeenCalled();
  });
});
