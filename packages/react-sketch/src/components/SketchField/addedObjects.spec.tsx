import { createRef } from "react";
import { act, render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "./SketchField";
import { SketchProperties, Tool } from "../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return {
    ...view,
    sketch,
    canvas: sketch["canvas"] as fabric.Canvas,
    /** The same sketch, with another tool */
    use: (tool: Tool) =>
      view.rerender(<SketchField ref={ref} {...props} tool={tool} />),
  };
};

/** The image which `addImg` adds: jsdom loads no image */
const stubImages = () =>
  jest.spyOn(fabric.FabricImage, "fromURL").mockImplementation(() =>
    Promise.resolve(
      new fabric.FabricImage(document.createElement("img"), {
        width: 100,
        height: 60,
      })
    )
  );

const settle = () => act(async () => void (await jest.advanceTimersByTimeAsync(50)));

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
  document.dispatchEvent(
    mouseEvent("mousemove", [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2])
  );
  document.dispatchEvent(mouseEvent("mousemove", to));
  document.dispatchEvent(mouseEvent("mouseup", to));
};

/** The tools which freeze the objects, as a drag with them always draws, or pans */
const FROZEN = [
  Tool.LINE,
  Tool.ARROW,
  Tool.RECTANGLE,
  Tool.RECTANGLE_LABEL,
  Tool.CIRCLE,
  Tool.POLYGON,
  Tool.PAN,
  Tool.DEFAULT_TOOL,
];

describe("objects added while a tool draws", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe.each(FROZEN)("with the %s tool", (tool) => {
    it("are not selectable: an image, a text", async () => {
      stubImages();
      const { sketch, canvas } = mount({ tool });

      sketch.addImg("data:image/png;base64,00", { left: 10, top: 10, scale: 1 });
      sketch.addText("Hello");
      await settle();

      const objects = canvas.getObjects();
      // The text is added at once, the image when it is loaded
      expect(objects.map((o) => o.type).sort()).toEqual(["i-text", "image"]);
      objects.forEach((object) => {
        expect(object.selectable).toBe(false);
        expect(object.evented).toBe(false);
      });
    });
  });

  it("are selectable with the select tool, and with the tools which draw free hand", async () => {
    stubImages();
    for (const tool of [Tool.SELECT, Tool.PENCIL, Tool.HIGHLIGHTER, Tool.ERASER]) {
      const { sketch, canvas, unmount } = mount({ tool });

      sketch.addImg("data:image/png;base64,00");
      sketch.addText("Hello");
      await settle();

      canvas.getObjects().forEach((object) => {
        expect(object.selectable).toBe(true);
        expect(object.evented).toBe(true);
      });
      unmount();
    }
  });

  it("are selectable again when the select tool takes over", async () => {
    stubImages();
    const { sketch, canvas, use } = mount({ tool: Tool.ARROW });
    sketch.addImg("data:image/png;base64,00");
    await settle();
    const [image] = canvas.getObjects();
    expect(image.selectable).toBe(false);

    use(Tool.SELECT);

    expect(image.selectable).toBe(true);
    expect(image.evented).toBe(true);
  });

  it("do not move when an arrow is drawn from them, and the arrow is drawn", async () => {
    stubImages();
    const { sketch, canvas } = mount({ tool: Tool.ARROW });
    sketch.addImg("data:image/png;base64,00", { left: 100, top: 100, scale: 1 });
    await settle();
    const [image] = canvas.getObjects();

    drag(canvas, [120, 120], [300, 200]);

    expect(canvas.getActiveObject()).toBeUndefined();
    expect([image.left, image.top]).toEqual([100, 100]);
    const objects = canvas.getObjects();
    expect(objects).toHaveLength(2);
    expect(objects[1]).toBeInstanceOf(fabric.Group);
  });

  it("are not selectable when a paste adds them, or an undo brings them back", async () => {
    const { sketch, canvas, use } = mount({ tool: Tool.SELECT });
    const rect = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50 });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    sketch.copy();
    sketch.removeSelected();
    expect(canvas.getObjects()).toHaveLength(0);

    use(Tool.ARROW);
    sketch.undo();
    sketch.paste();
    await settle();

    const objects = canvas.getObjects();
    expect(objects).toHaveLength(2);
    objects.forEach((object) => {
      expect(object.selectable).toBe(false);
      expect(object.evented).toBe(false);
    });
  });
});
