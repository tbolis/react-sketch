import { createRef, StrictMode } from "react";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import * as fabric from "fabric";
import SketchField from "./SketchField";
import { SketchProperties, Tool } from "../../types";

type Point = [number, number];
type Identified = fabric.FabricObject & { id?: string };

/** The fabric canvas of a mounted SketchField */
const canvasOf = (sketch: SketchField): fabric.Canvas => sketch["canvas"];

/** Mount a SketchField, and give access to its methods and its canvas */
const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return {
    ...view,
    sketch,
    canvas: canvasOf(sketch),
    update: (next: SketchProperties) =>
      view.rerender(<SketchField ref={ref} {...next} />),
  };
};

const mouseEvent = (type: string, [x, y]: Point): { e: MouseEvent } => ({
  e: new MouseEvent(type, { clientX: x, clientY: y }),
});

/**
 * Press the mouse at `from`, move it to `to` and release it. Returns the
 * newest object of the canvas, which is the one drawn.
 */
const objectFromDrag = (
  canvas: fabric.Canvas,
  from: Point = [0, 0],
  to: Point = [10, 10],
  id?: string
): Identified => {
  fire(canvas, "mouse:down", mouseEvent("mousedown", from));
  fire(canvas, "mouse:move", mouseEvent("mousemove", to));
  fire(canvas, "mouse:up", mouseEvent("mouseup", to));
  const objects = canvas.getObjects();
  const newObj: Identified = objects[objects.length - 1];
  if (id) newObj.id = id;
  return newObj;
};

/** Let the pending promises (the loading of images, cloning) settle */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Fire a canvas event, as the canvas does when the user interacts with it */
const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, event);

const ids = (canvas: fabric.Canvas): (string | undefined)[] =>
  canvas.getObjects().map((o: Identified) => o.id);

/** What the browser would lay out for the container of the sketch */
const layout = (width: number, height: number): void => {
  jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(width);
  jest.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(height);
};

/**
 * The error that a failed load of a value throws. It is thrown outside the
 * promise, so it comes out of the timers, a few promise steps after the load
 * started. Needs fake timers. Resolves with undefined when nothing was thrown.
 */
const errorOfLoad = async (): Promise<unknown> => {
  const errors: unknown[] = [];
  for (let round = 0; round < 2; round++) {
    await jest.advanceTimersByTimeAsync(100).catch((error) => errors.push(error));
    for (let step = 0; step < 20; step++) await Promise.resolve();
  }
  return errors[0];
};

/** An image of 200 by 100 pixels, which loads as soon as its source is set */
const stubImageLoads = () =>
  jest.spyOn(window, "Image").mockImplementation(() => {
    const img = document.createElement("img");
    img.width = 200;
    img.height = 100;
    Object.defineProperty(img, "src", {
      set: () => img.onload?.(new Event("load")),
    });
    return img;
  });

const rect = (left: number, top: number, fill = "red") => ({
  type: "rect",
  left,
  top,
  width: 30,
  height: 40,
  fill,
});

const START: Point = [10, 10];
const END: Point = [40, 50];

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("SketchField", () => {
  describe("rendering", () => {
    it("renders a canvas inside a container div with default props", () => {
      const { container } = render(<SketchField />);
      const sketch = container.firstElementChild;

      expect(sketch).toBeInstanceOf(HTMLDivElement);
      expect(sketch?.querySelector("canvas")).toBeInTheDocument();
    });

    it("applies width, height, className and style to the container", () => {
      const { container } = render(
        <SketchField
          width={320}
          height={240}
          className="sketch"
          style={{ border: "1px solid red" }}
        />
      );

      expect(container.firstElementChild).toHaveClass("sketch");
      expect(container.firstElementChild).toHaveStyle({
        width: "320px",
        height: "240px",
        border: "1px solid red",
      });
    });

    it("is 512 pixels high unless a height is given", () => {
      const { container } = render(<SketchField />);

      expect(container.firstElementChild).toHaveStyle({ height: "512px" });
    });

    it("mounts, unmounts and mounts again in strict mode", () => {
      const ref = createRef<SketchField>();
      const { container } = render(
        <StrictMode>
          <SketchField ref={ref} tool={Tool.RECTANGLE} />
        </StrictMode>
      );
      const sketch = ref.current as SketchField;
      const canvas = canvasOf(sketch);

      expect(container.querySelectorAll(".canvas-container")).toHaveLength(1);
      objectFromDrag(canvas, START, END);
      expect(canvas.getObjects()).toHaveLength(1);
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
    });
  });

  describe("server rendering", () => {
    it("renders the same markup every time, so the page of a server hydrates", () => {
      expect(renderToString(<SketchField width={300} />)).toEqual(
        renderToString(<SketchField width={300} />)
      );
    });
  });

  describe("default props", () => {
    it("has the defaults of 0.5.x", () => {
      expect(SketchField.defaultProps).toMatchObject({
        lineColor: "black",
        lineWidth: 10,
        fillColor: "transparent",
        backgroundColor: "transparent",
        opacity: 1.0,
        undoSteps: 25,
        widthCorrection: 0,
        heightCorrection: 0,
        forceValue: false,
      });
    });

    it("has event callbacks which do nothing", () => {
      const callbacks = [
        "onObjectAdded",
        "onObjectModified",
        "onObjectRemoved",
        "onMouseDown",
        "onMouseMove",
        "onMouseUp",
        "onMouseOut",
        "onObjectMoving",
        "onObjectScaling",
        "onObjectRotating",
      ] as const;
      callbacks.forEach((name) => {
        expect(SketchField.defaultProps[name]({})).toBeUndefined();
      });
    });

    it("selects objects, without drawing, when no tool is given", () => {
      const { canvas } = mount();

      expect(canvas.isDrawingMode).toBe(false);
      expect(canvas.selection).toBe(true);
    });

    it("draws with a black line, 10 pixels wide, by default", () => {
      const { canvas } = mount({ tool: Tool.PENCIL });

      expect(canvas.freeDrawingBrush?.color).toEqual("black");
      expect(canvas.freeDrawingBrush?.width).toEqual(10);
    });

    it("also selects objects when the tool is null, as in 0.5.x", () => {
      const { canvas } = mount({ tool: null as unknown as string });

      expect(canvas.isDrawingMode).toBe(false);
      expect(canvas.selection).toBe(true);
    });
  });

  describe("tool", () => {
    it("draws with the pencil, using the line color and width", () => {
      const { canvas } = mount({
        tool: Tool.PENCIL,
        lineColor: "red",
        lineWidth: 3,
      });

      expect(canvas.isDrawingMode).toBe(true);
      expect(canvas.freeDrawingBrush?.color).toEqual("red");
      expect(canvas.freeDrawingBrush?.width).toEqual(3);
    });

    it("uses the regular pointer when drawing with the pencil (#181)", () => {
      const { canvas } = mount({ tool: Tool.PENCIL });

      expect(canvas.freeDrawingCursor).toEqual("default");
    });

    it("recreates the tool when it changes", () => {
      const { canvas, update } = mount({ tool: Tool.PENCIL });
      expect(canvas.isDrawingMode).toBe(true);

      update({ tool: Tool.SELECT });
      expect(canvas.isDrawingMode).toBe(false);
      expect(canvas.selection).toBe(true);

      update({ tool: Tool.RECTANGLE });
      expect(canvas.selection).toBe(false);
      objectFromDrag(canvas, START, END);
      expect(canvas.getObjects()[0].type).toEqual("rect");

      update({ tool: Tool.PAN });
      expect(canvas.defaultCursor).toEqual("move");

      update({ tool: Tool.LINE });
      expect(canvas.defaultCursor).toEqual("default");
    });

    it("configures the tool again when the line color or width change (#114)", () => {
      const { canvas, update } = mount({
        tool: Tool.PENCIL,
        lineColor: "red",
        lineWidth: 3,
      });

      update({ tool: Tool.PENCIL, lineColor: "blue", lineWidth: 7 });

      expect(canvas.freeDrawingBrush?.color).toEqual("blue");
      expect(canvas.freeDrawingBrush?.width).toEqual(7);
    });

    it("configures the tool again when the fill color changes", () => {
      const { canvas, update } = mount({
        tool: Tool.RECTANGLE,
        fillColor: "yellow",
      });
      expect(objectFromDrag(canvas, START, END).fill).toEqual("yellow");

      update({ tool: Tool.RECTANGLE, fillColor: "green" });

      expect(objectFromDrag(canvas, START, END).fill).toEqual("green");
    });

    it("does not break on a line color the highlighter cannot convert", () => {
      ["rgb(255, 0, 0)", "transparent"].forEach((lineColor) => {
        const { canvas, unmount } = mount({ tool: Tool.HIGHLIGHTER, lineColor });

        // the default line color is used instead
        expect(canvas.isDrawingMode).toBe(true);
        expect(canvas.freeDrawingBrush?.color).toEqual("rgba(0,0,0,0.4)");
        unmount();
      });
    });

    it("converts the line color of the highlighter, and follows its changes", () => {
      const { canvas, update } = mount({
        tool: Tool.HIGHLIGHTER,
        lineColor: "#ff0000",
      });
      expect(canvas.freeDrawingBrush?.color).toEqual("rgba(255,0,0,0.4)");

      expect(() =>
        update({ tool: Tool.HIGHLIGHTER, lineColor: "rgb(0, 0, 255)" })
      ).not.toThrow();
      expect(canvas.freeDrawingBrush?.color).toEqual("rgba(0,0,0,0.4)");

      update({ tool: Tool.HIGHLIGHTER, lineColor: "blue" });
      expect(canvas.freeDrawingBrush?.color).toEqual("rgba(0,0,255,0.4)");
    });
  });

  describe("background", () => {
    it("is transparent by default, and follows backgroundColor (#87)", () => {
      const { canvas, update } = mount();
      expect(canvas.backgroundColor).toEqual("transparent");

      update({ backgroundColor: "red" });
      expect(canvas.backgroundColor).toEqual("red");

      update({ backgroundColor: "rgba(0, 0, 255, 0.5)" });
      expect(canvas.backgroundColor).toEqual("rgba(0, 0, 255, 0.5)");
    });

    it("is applied when the component mounts", () => {
      const { canvas } = mount({ backgroundColor: "#00ff00" });

      expect(canvas.backgroundColor).toEqual("#00ff00");
    });
  });

  describe("size", () => {
    it("fits the canvas to its container when it mounts", () => {
      layout(400, 300);

      const { canvas } = mount();

      expect(canvas.getWidth()).toEqual(400);
      expect(canvas.getHeight()).toEqual(300);
    });

    it("subtracts widthCorrection and heightCorrection", () => {
      layout(400, 300);

      const { canvas } = mount({ widthCorrection: 20, heightCorrection: 50 });

      expect(canvas.getWidth()).toEqual(380);
      expect(canvas.getHeight()).toEqual(250);
    });

    it("scales the objects with the canvas", () => {
      layout(300, 150);
      const { canvas, update } = mount({ tool: Tool.RECTANGLE });
      objectFromDrag(canvas, START, END);

      layout(600, 300);
      update({ tool: Tool.RECTANGLE, width: 600 });

      const [object] = canvas.getObjects();
      expect(canvas.getWidth()).toEqual(600);
      expect(object.left).toEqual(START[0] * 2);
      expect(object.top).toEqual(START[1] * 2);
      expect(object.scaleX).toEqual(2);
    });

    it("fits the canvas again when width or height change", () => {
      layout(200, 100);
      const { canvas, update } = mount({ width: 200, height: 100 });
      expect(canvas.getWidth()).toEqual(200);

      layout(250, 120);
      update({ width: 250, height: 120 });

      expect(canvas.getWidth()).toEqual(250);
      expect(canvas.getHeight()).toEqual(120);
    });

    it("leaves the canvas alone when its container has no size", () => {
      layout(0, 0);
      const { canvas } = mount({ tool: Tool.RECTANGLE });
      const width = canvas.getWidth();
      objectFromDrag(canvas, START, END);

      window.dispatchEvent(new Event("resize"));

      expect(canvas.getWidth()).toEqual(width);
      expect(canvas.getObjects()[0].scaleX).toEqual(1);
    });

    it("follows the window when autoresize is on (default)", () => {
      layout(400, 300);
      const { canvas } = mount();

      layout(500, 300);
      window.dispatchEvent(new Event("resize"));

      expect(canvas.getWidth()).toEqual(500);
    });

    it("scales the background image with the canvas, as the objects", () => {
      stubImageLoads();
      layout(400, 300);
      const { sketch, canvas } = mount();
      sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
        stretched: true,
      });

      layout(800, 600);
      window.dispatchEvent(new Event("resize"));

      // 200 by 100 pixels, stretched to 400 by 300, then to 800 by 600
      const image = canvas.backgroundImage as fabric.FabricImage;
      expect([image.scaleX, image.scaleY]).toEqual([4, 6]);
    });

    it("does not follow the window when autoresize is off", () => {
      layout(400, 300);
      const { canvas } = mount({ autoresize: false });

      layout(500, 300);
      window.dispatchEvent(new Event("resize"));

      expect(canvas.getWidth()).toEqual(400);
    });

    it("removes the resize listener, with the arguments it was added with", () => {
      const add = jest.spyOn(window, "addEventListener");
      const remove = jest.spyOn(window, "removeEventListener");

      const { unmount } = mount();
      unmount();

      // fabric listens to the window too, only the ones of the component count
      const resizes = (spy: jest.SpyInstance) =>
        spy.mock.calls.filter(
          ([type, listener]) =>
            type === "resize" && listener.name === "_resize_listener"
        );
      expect(resizes(add)).toHaveLength(1);
      expect(resizes(remove)).toEqual(resizes(add));
    });

    it("disposes the canvas when it unmounts", () => {
      const dispose = jest.spyOn(fabric.Canvas.prototype, "dispose");

      const { unmount } = mount();
      unmount();

      expect(dispose).toHaveBeenCalledTimes(1);
    });
  });

  describe("drawing", () => {
    it("drags to create a rectangle", () => {
      const { canvas } = mount({ tool: Tool.RECTANGLE });
      const bounding = {
        left: START[0],
        top: START[1],
        width: END[0] - START[0],
        height: END[1] - START[1],
      };

      // From left-top to right-bottom
      const rect1 = objectFromDrag(canvas, START, END);
      expect(canvas.getObjects()).toHaveLength(1);
      expect(rect1.type).toEqual("rect");
      expect({
        left: rect1.left,
        top: rect1.top,
        width: rect1.width,
        height: rect1.height,
      }).toEqual(bounding);

      canvas.remove(rect1);
      // From right-bottom to left-top
      const rect2 = objectFromDrag(canvas, END, START);
      expect(rect2.type).toEqual("rect");
      expect({
        left: rect2.left,
        top: rect2.top,
        width: rect2.width,
        height: rect2.height,
      }).toEqual(bounding);
    });

    it("draws with the line color, line width and fill color", () => {
      const { canvas } = mount({
        tool: Tool.RECTANGLE,
        lineColor: "red",
        lineWidth: 4,
        fillColor: "blue",
      });

      const object = objectFromDrag(canvas, START, END);

      expect(object.stroke).toEqual("red");
      expect(object.strokeWidth).toEqual(4);
      expect(object.fill).toEqual("blue");
    });
  });

  describe("history", () => {
    it("undoes and redoes multiple rectangles added to the canvas", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });

      canvas.renderOnAddRemove = false;
      objectFromDrag(canvas, START, END, "rect1");
      objectFromDrag(canvas, START, END, "rect2");
      expect(ids(canvas)).toEqual(["rect1", "rect2"]);

      sketch.undo();
      expect(ids(canvas)).toEqual(["rect1"]);

      sketch.undo();
      expect(ids(canvas)).toEqual([]);

      sketch.redo();
      expect(ids(canvas)).toEqual(["rect1"]);

      objectFromDrag(canvas, START, END, "rect3");
      expect(ids(canvas)).toEqual(["rect1", "rect3"]);

      sketch.undo();
      expect(ids(canvas)).toEqual(["rect1"]);
    });

    it("undoes and redoes multiple modifications of a single rectangle", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      const stateOf = () => canvas.getObjects()[0].toJSON();

      // [Action1] Add new rectangle object and save its state
      const stateStack = [];
      const rect1 = objectFromDrag(canvas, START, END);
      stateStack.push(rect1.toJSON());

      // [Action2] Change rectangle dimension and save its state
      rect1.set({ width: 50, height: 60 });
      rect1.setCoords();
      fire(canvas, "object:modified", { target: rect1 });
      stateStack.push(rect1.toJSON());

      // [Action3] Change the position and save its state
      rect1.set({ left: 20, top: 70 });
      rect1.setCoords();
      fire(canvas, "object:modified", { target: rect1 });
      stateStack.push(rect1.toJSON());

      // Undo Action3
      sketch.undo();
      expect(stateOf()).toEqual(stateStack[1]);

      // Undo Action2
      sketch.undo();
      expect(stateOf()).toEqual(stateStack[0]);

      // Undo Action1, and then redo Action1
      sketch.undo();
      expect(canvas.getObjects()).toHaveLength(0);
      sketch.redo();
      expect(stateOf()).toEqual(stateStack[0]);

      // redo Action2
      sketch.redo();
      expect(stateOf()).toEqual(stateStack[1]);

      // redo Action3
      sketch.redo();
      expect(stateOf()).toEqual(stateStack[2]);
    });

    it("modifies from the state it was undone to", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      const rect1 = objectFromDrag(canvas, START, END);
      const original = rect1.toJSON();
      rect1.set({ left: 100 });
      fire(canvas, "object:modified", { target: rect1 });
      sketch.undo();

      rect1.set({ left: 200 });
      fire(canvas, "object:modified", { target: rect1 });
      sketch.undo();

      expect(canvas.getObjects()[0].toJSON()).toEqual(original);
    });

    it("ignores the modification of objects it does not know", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      const stranger = new fabric.Rect({ width: 5, height: 5 });

      fire(canvas, "object:modified", { target: stranger });

      expect(sketch.canUndo()).toBe(false);
    });

    it("tells whether it can undo and redo", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      expect(sketch.canUndo()).toBe(false);
      expect(sketch.canRedo()).toBe(false);

      objectFromDrag(canvas, START, END);
      expect(sketch.canUndo()).toBe(true);
      expect(sketch.canRedo()).toBe(false);

      sketch.undo();
      expect(sketch.canUndo()).toBe(false);
      expect(sketch.canRedo()).toBe(true);

      sketch.redo();
      expect(sketch.canUndo()).toBe(true);
      expect(sketch.canRedo()).toBe(false);
    });

    it("leaves the canvas intact when there is nothing to undo or redo", () => {
      const onChange = jest.fn();
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE, onChange });
      objectFromDrag(canvas, START, END);

      expect(() => {
        sketch.redo();
        sketch.undo();
        sketch.undo();
        sketch.undo();
      }).not.toThrow();

      expect(canvas.getObjects()).toHaveLength(0);
      // once for the undo, nothing for the ones which had no effect
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("keeps undoSteps steps, and one more for the current one, as in 0.5.x", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE, undoSteps: 2 });
      for (let i = 0; i < 5; i++) objectFromDrag(canvas, START, END);

      let undone = 0;
      while (sketch.canUndo()) {
        sketch.undo();
        undone++;
      }

      expect(undone).toEqual(3);
      expect(canvas.getObjects()).toHaveLength(2);
    });

    it("forgets a redo once something new is drawn", () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      objectFromDrag(canvas, START, END);
      sketch.undo();
      expect(sketch.canRedo()).toBe(true);

      objectFromDrag(canvas, START, END);

      expect(sketch.canRedo()).toBe(false);
    });

    it("calls onChange, without arguments, after undo and redo", () => {
      const onChange = jest.fn();
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE, onChange });
      objectFromDrag(canvas, START, END);

      sketch.undo();
      expect(onChange).toHaveBeenLastCalledWith();

      onChange.mockClear();
      sketch.redo();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith();
    });
  });

  describe("callbacks", () => {
    it("calls onChange with the DOM event, a moment after mouse up and mouse out", () => {
      jest.useFakeTimers();
      const onChange = jest.fn();
      const { canvas } = mount({ tool: Tool.RECTANGLE, onChange });

      const up = mouseEvent("mouseup", END);
      fire(canvas, "mouse:up", up);
      expect(onChange).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(up.e);

      const out = mouseEvent("mouseout", END);
      fire(canvas, "mouse:out", out);
      jest.advanceTimersByTime(10);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith(out.e);
    });

    it("does not call onChange after the component is unmounted", () => {
      jest.useFakeTimers();
      const onChange = jest.fn();
      const { canvas, unmount } = mount({ tool: Tool.RECTANGLE, onChange });
      fire(canvas, "mouse:up", mouseEvent("mouseup", END));

      unmount();
      jest.advanceTimersByTime(1000);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("calls the mouse callbacks", () => {
      const onMouseDown = jest.fn();
      const onMouseMove = jest.fn();
      const onMouseUp = jest.fn();
      const onMouseOut = jest.fn();
      const { canvas } = mount({
        tool: Tool.RECTANGLE,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseOut,
      });

      objectFromDrag(canvas, START, END);
      fire(canvas, "mouse:out", mouseEvent("mouseout", END));

      expect(onMouseDown).toHaveBeenCalledTimes(1);
      expect(onMouseDown.mock.calls[0][0].e).toBeInstanceOf(MouseEvent);
      expect(onMouseMove).toHaveBeenCalledTimes(1);
      expect(onMouseUp).toHaveBeenCalledTimes(1);
      expect(onMouseOut).toHaveBeenCalledTimes(1);
    });

    it("calls onObjectAdded when the user adds an object, not when undo or redo does", () => {
      const onObjectAdded = jest.fn();
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE, onObjectAdded });

      const object = objectFromDrag(canvas, START, END);
      expect(onObjectAdded).toHaveBeenCalledTimes(1);
      expect(onObjectAdded.mock.calls[0][0].target).toBe(object);

      sketch.undo();
      sketch.redo();
      expect(onObjectAdded).toHaveBeenCalledTimes(1);
    });

    it("calls onObjectRemoved when an object is removed, also by undo", () => {
      const onObjectRemoved = jest.fn();
      const { sketch, canvas } = mount({
        tool: Tool.RECTANGLE,
        onObjectRemoved,
      });
      const object = objectFromDrag(canvas, START, END);

      sketch.undo();

      expect(onObjectRemoved).toHaveBeenCalledTimes(1);
      expect(onObjectRemoved.mock.calls[0][0].target).toBe(object);
    });

    it("calls onObjectModified, onObjectMoving, onObjectScaling and onObjectRotating", () => {
      const onObjectModified = jest.fn();
      const onObjectMoving = jest.fn();
      const onObjectScaling = jest.fn();
      const onObjectRotating = jest.fn();
      const { canvas } = mount({
        tool: Tool.RECTANGLE,
        onObjectModified,
        onObjectMoving,
        onObjectScaling,
        onObjectRotating,
      });
      const object = objectFromDrag(canvas, START, END);

      fire(canvas, "object:modified", { target: object });
      fire(canvas, "object:moving", { target: object });
      fire(canvas, "object:scaling", { target: object });
      fire(canvas, "object:rotating", { target: object });

      [onObjectModified, onObjectMoving, onObjectScaling, onObjectRotating].forEach(
        (callback) => {
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback.mock.calls[0][0].target).toBe(object);
        }
      );
    });

    it("does not need any callback", () => {
      const { canvas } = mount({
        tool: Tool.RECTANGLE,
        onMouseDown: null as unknown as undefined,
      });

      expect(() => objectFromDrag(canvas, START, END)).not.toThrow();
    });
  });

  describe("value", () => {
    beforeEach(() => jest.useFakeTimers());

    const load = () => jest.advanceTimersByTimeAsync(100);

    it("loads defaultValue when it mounts", async () => {
      const { canvas } = mount({
        defaultValue: { objects: [rect(10, 10), rect(50, 50)] },
      });
      expect(canvas.getObjects()).toHaveLength(0);

      await load();

      expect(canvas.getObjects()).toHaveLength(2);
    });

    it("loads value when it mounts, rather than defaultValue", async () => {
      const { canvas } = mount({
        value: { objects: [rect(10, 10)] },
        defaultValue: { objects: [rect(10, 10), rect(50, 50)] },
      });

      await load();

      expect(canvas.getObjects()).toHaveLength(1);
    });

    it("loads value when it changes, not when it stays the same", async () => {
      const first = { objects: [rect(10, 10)] };
      const second = { objects: [rect(10, 10), rect(50, 50)] };
      const { canvas, update } = mount({ value: first });
      const loadFromJSON = jest.spyOn(canvas, "loadFromJSON");
      await load();
      expect(loadFromJSON).toHaveBeenCalledTimes(1);

      update({ value: second });
      await load();
      expect(canvas.getObjects()).toHaveLength(2);
      expect(loadFromJSON).toHaveBeenCalledTimes(2);

      update({ value: second, className: "other" });
      await load();
      expect(loadFromJSON).toHaveBeenCalledTimes(2);
    });

    it("loads value on every update when forceValue is set", async () => {
      const value = { objects: [rect(10, 10)] };
      const { canvas, update } = mount({ value, forceValue: true });
      const loadFromJSON = jest.spyOn(canvas, "loadFromJSON");
      await load();

      update({ value, forceValue: true, className: "other" });
      await load();

      expect(loadFromJSON).toHaveBeenCalledTimes(2);
    });

    it("calls onChange, without arguments, once the value is loaded", async () => {
      const onChange = jest.fn();
      mount({ value: { objects: [rect(10, 10)] }, onChange });
      expect(onChange).not.toHaveBeenCalled();

      await load();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith();
    });

    it("keeps the background color of the sketch when the value has none", async () => {
      const { canvas, update } = mount({
        backgroundColor: "red",
        value: { objects: [rect(10, 10)] },
      });
      await load();
      expect(canvas.backgroundColor).toEqual("red");

      update({
        backgroundColor: "red",
        value: { objects: [], background: "blue" },
      });
      await load();
      expect(canvas.backgroundColor).toEqual("blue");
    });

    it("makes the loaded objects follow the tool", async () => {
      const { canvas } = mount({
        tool: Tool.DEFAULT_TOOL,
        value: { objects: [rect(10, 10)] },
      });

      await load();

      const [object] = canvas.getObjects();
      expect(canvas.selection).toBe(false);
      expect(object.selectable).toBe(false);
      expect(object.evented).toBe(false);
    });

    it("does not load into a canvas which is gone", async () => {
      const { canvas, unmount } = mount({ value: { objects: [rect(10, 10)] } });
      const loadFromJSON = jest.spyOn(canvas, "loadFromJSON");

      unmount();
      await load();

      expect(loadFromJSON).not.toHaveBeenCalled();
    });
  });

  describe("a value that cannot be loaded", () => {
    beforeEach(() => jest.useFakeTimers());
    // fabric does not know the type, so the load fails after it started
    const unknownType = { objects: [{ type: "NoSuchShape", left: 1 }] };
    it("leaves the objects and the history of the canvas as they were", async () => {
      const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
      objectFromDrag(canvas, START, END);

      sketch.fromJSON(unknownType);
      await errorOfLoad();

      expect(canvas.getObjects()).toHaveLength(1);
      expect(sketch.canUndo()).toBe(true);
    });

    it("leaves the canvas drawing the objects which are added afterwards", async () => {
      const { sketch, canvas } = mount();

      sketch.fromJSON(unknownType);
      await errorOfLoad();

      // fabric turns this off while it loads, and on again only when the load works
      expect(canvas.renderOnAddRemove).toBe(true);
    });

    it("does not hide the error, for an unknown type or for JSON that is not valid", async () => {
      const { sketch } = mount();

      sketch.fromJSON(unknownType);
      expect(String(await errorOfLoad())).toMatch(/NoSuchShape/);

      sketch.fromJSON("{not json");
      expect(await errorOfLoad()).toBeInstanceOf(SyntaxError);
    });
  });

  describe("values loaded one after the other", () => {
    beforeEach(() => jest.useFakeTimers());

    it("cancels the load which is still running when a newer value starts", async () => {
      const { sketch, canvas } = mount();
      const signals: (AbortSignal | undefined)[] = [];
      jest.spyOn(canvas, "loadFromJSON").mockImplementation((...args) => {
        signals.push(args[2]?.signal);
        return new Promise(() => undefined);
      });

      sketch.fromJSON({ objects: [rect(1, 1)] });
      await jest.advanceTimersByTimeAsync(100);
      sketch.fromJSON({ objects: [rect(2, 2)] });
      await jest.advanceTimersByTimeAsync(100);

      expect(signals).toHaveLength(2);
      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
    });

    it("does not take a cancelled load for an error", async () => {
      const { sketch, canvas } = mount();
      let calls = 0;
      jest.spyOn(canvas, "loadFromJSON").mockImplementation((...args) => {
        const signal = args[2]?.signal;
        return calls++ === 0
          ? new Promise((resolve, reject) =>
              // as fabric does when its signal is aborted
              signal?.addEventListener("abort", () => reject(new Error("aborted")))
            )
          : Promise.resolve(canvas);
      });

      sketch.fromJSON({ objects: [rect(1, 1)] });
      await jest.advanceTimersByTimeAsync(100);
      sketch.fromJSON({ objects: [rect(2, 2)] });

      // An error for the cancelled load would come out of the timers
      expect(await errorOfLoad()).toBeUndefined();
      expect(calls).toBe(2);
    });
  });

  describe("methods", () => {
    describe("enableTouchScroll and disableTouchScroll", () => {
      it("switch the touch scrolling of the canvas", () => {
        const { sketch, canvas } = mount();
        expect(canvas.allowTouchScrolling).toBeFalsy();

        sketch.enableTouchScroll();
        expect(canvas.allowTouchScrolling).toBe(true);
        sketch.enableTouchScroll();
        expect(canvas.allowTouchScrolling).toBe(true);

        sketch.disableTouchScroll();
        expect(canvas.allowTouchScrolling).toBe(false);
        sketch.disableTouchScroll();
        expect(canvas.allowTouchScrolling).toBe(false);
      });

      // jsdom does not implement touch-action: it keeps the assigned value only
      // on the style object, which is what the component sets.
      it("switch the touch-action style that lets the browser scroll", () => {
        const { sketch, canvas } = mount();

        sketch.enableTouchScroll();
        expect(canvas.upperCanvasEl.style.touchAction).toBe("manipulation");
        expect(canvas.lowerCanvasEl.style.touchAction).toBe("manipulation");

        sketch.disableTouchScroll();
        expect(canvas.upperCanvasEl.style.touchAction).toBe("none");
        expect(canvas.lowerCanvasEl.style.touchAction).toBe("none");
      });
    });

    describe("addImg", () => {
      const stubImages = () =>
        jest.spyOn(fabric.FabricImage, "fromURL").mockImplementation(() =>
          Promise.resolve(
            new fabric.FabricImage(document.createElement("img"), {
              width: 100,
              height: 60,
            })
          )
        );

      it("adds the image at the given position and scale", async () => {
        const fromURL = stubImages();
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;

        sketch.addImg("data:image/png;base64,00", {
          left: 15,
          top: 25,
          scale: 2,
        });
        await settle();

        const [image] = canvas.getObjects();
        expect(fromURL).toHaveBeenCalledWith(
          "data:image/png;base64,00",
          {},
          { originX: "left", originY: "top" }
        );
        expect(image.type).toEqual("image");
        expect([image.left, image.top, image.scaleX]).toEqual([15, 25, 2]);
      });

      it("scales the image to half, and places it at random, by default", async () => {
        stubImages();
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;

        sketch.addImg("data:image/png;base64,00");
        await settle();

        const [image] = canvas.getObjects();
        expect(image.scaleX).toEqual(0.5);
        expect(image.left).toEqual(0.5 * (canvas.getWidth() - 100 * 0.5));
        expect(image.top).toEqual(0.5 * (canvas.getHeight() - 60 * 0.5));
      });

      it("can be undone", async () => {
        stubImages();
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;
        sketch.addImg("data:image/png;base64,00");
        await settle();

        sketch.undo();

        expect(canvas.getObjects()).toHaveLength(0);
      });

      it("adds nothing when the component was unmounted meanwhile", async () => {
        let finish: () => void = () => undefined;
        jest.spyOn(fabric.FabricImage, "fromURL").mockImplementation(
          () =>
            new Promise((resolve) => {
              const image = new fabric.FabricImage(document.createElement("img"));
              finish = () => resolve(image);
            })
        );
        const { sketch, canvas, unmount } = mount();
        const add = jest.spyOn(canvas, "add");
        sketch.addImg("data:image/png;base64,00");

        unmount();
        finish();
        await settle();

        expect(add).not.toHaveBeenCalled();
      });

      it("adds nothing, and does not fail, when the image cannot be loaded", async () => {
        jest
          .spyOn(fabric.FabricImage, "fromURL")
          .mockImplementation(() => Promise.reject(new Error("no image")));
        const { sketch, canvas } = mount();

        sketch.addImg("not-an-image");
        await settle();

        expect(canvas.getObjects()).toHaveLength(0);
      });
    });

    describe("zoom", () => {
      it("scales the objects and their position by the factor", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);

        sketch.zoom(2);
        const [object] = canvas.getObjects();
        expect([object.left, object.top]).toEqual([20, 20]);
        expect([object.scaleX, object.scaleY]).toEqual([2, 2]);

        sketch.zoom(0.5);
        expect([object.left, object.top]).toEqual([10, 10]);
        expect([object.scaleX, object.scaleY]).toEqual([1, 1]);
      });

      it("scales the background image too, so the drawing stays on it", () => {
        stubImageLoads();
        const { sketch, canvas } = mount();
        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          left: 10,
          top: 20,
        });

        sketch.zoom(2);

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect([image.left, image.top, image.scaleX, image.scaleY]).toEqual([
          20, 40, 2, 2,
        ]);
      });
    });

    describe("toDataURL", () => {
      it("exports the canvas as png", () => {
        const { sketch } = mount();

        expect(sketch.toDataURL()).toMatch(/^data:image\/png;base64,/);
      });

      it("takes the format from the options, then from imageFormat", () => {
        const { sketch, update } = mount();
        expect(sketch.toDataURL({ format: "jpeg" })).toMatch(
          /^data:image\/jpeg;base64,/
        );

        update({ imageFormat: "jpeg" });
        expect(sketch.toDataURL()).toMatch(/^data:image\/jpeg;base64,/);
        expect(sketch.toDataURL({ format: "png" })).toMatch(
          /^data:image\/png;base64,/
        );
      });

      it("passes the options to the canvas", () => {
        const { sketch, canvas } = mount();
        const toDataURL = jest.spyOn(canvas, "toDataURL");

        sketch.toDataURL({ multiplier: 2, left: 1, top: 2, width: 3, height: 4 });

        expect(toDataURL).toHaveBeenCalledWith(
          expect.objectContaining({
            multiplier: 2,
            left: 1,
            top: 2,
            width: 3,
            height: 4,
          })
        );
      });
    });

    describe("toJSON", () => {
      it("returns the canvas as an object", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);
        objectFromDrag(canvas, START, END);

        const json = sketch.toJSON();

        expect(typeof json).toEqual("object");
        expect(json.objects).toHaveLength(2);
        expect(JSON.parse(JSON.stringify(json))).toEqual(json);
      });

      it("includes the properties asked for", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END, "rect1");

        expect(sketch.toJSON().objects).toEqual([
          expect.not.objectContaining({ id: "rect1" }),
        ]);
        expect(sketch.toJSON(["id"]).objects).toEqual([
          expect.objectContaining({ id: "rect1" }),
        ]);
      });
    });

    describe("fromJSON", () => {
      beforeEach(() => jest.useFakeTimers());

      it("populates the canvas a moment later, from an object or a string", async () => {
        const { sketch, canvas } = mount();

        sketch.fromJSON({ objects: [rect(10, 10)] });
        expect(canvas.getObjects()).toHaveLength(0);
        await jest.advanceTimersByTimeAsync(100);
        expect(canvas.getObjects()).toHaveLength(1);

        sketch.fromJSON(JSON.stringify({ objects: [rect(10, 10), rect(5, 5)] }));
        await jest.advanceTimersByTimeAsync(100);
        expect(canvas.getObjects()).toHaveLength(2);
      });

      it("does nothing without a value", async () => {
        const { sketch, canvas } = mount();
        const loadFromJSON = jest.spyOn(canvas, "loadFromJSON");

        sketch.fromJSON();
        sketch.fromJSON("");
        await jest.advanceTimersByTimeAsync(100);

        expect(loadFromJSON).not.toHaveBeenCalled();
      });

      it("restores what toJSON returned", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);
        const saved = sketch.toJSON();
        canvas.clear();

        sketch.fromJSON(saved);
        await jest.advanceTimersByTimeAsync(100);

        expect(canvas.getObjects()).toHaveLength(1);
        expect(canvas.getObjects()[0].type).toEqual("rect");
      });

      it("starts the history again with the loaded objects", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        const stale = objectFromDrag(canvas, START, END);

        sketch.fromJSON({ objects: [rect(10, 10), rect(50, 50)] });
        await jest.advanceTimersByTimeAsync(100);
        expect(canvas.getObjects()).toHaveLength(2);

        // undo takes the loaded objects back one by one, and never brings
        // back the one which was replaced
        sketch.undo();
        sketch.undo();
        expect(sketch.canUndo()).toBe(false);
        sketch.redo();
        sketch.redo();
        expect(canvas.getObjects()).toHaveLength(2);
        expect(canvas.getObjects()).not.toContain(stale);
      });
    });

    describe("clear", () => {
      it("empties the canvas and the history, and returns what was on it", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);
        objectFromDrag(canvas, START, END);

        const discarded = sketch.clear();

        expect(discarded.objects).toHaveLength(2);
        expect(canvas.getObjects()).toHaveLength(0);
        expect(sketch.canUndo()).toBe(false);
        expect(sketch.canRedo()).toBe(false);
      });

      it("returns the properties asked for", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END, "rect1");

        expect(sketch.clear(["id"]).objects).toEqual([
          expect.objectContaining({ id: "rect1" }),
        ]);
      });

      it("keeps the background color of the sketch", () => {
        const { sketch, canvas } = mount({ backgroundColor: "red" });

        sketch.clear();

        expect(canvas.backgroundColor).toEqual("red");
      });
    });

    describe("selection", () => {
      it("tells whether there is a selection, and clears it", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);
        expect(sketch.hasSelection()).toBe(false);

        canvas.setActiveObject(canvas.getObjects()[0]);
        expect(sketch.hasSelection()).toBe(true);

        sketch.clearSelection();
        expect(sketch.hasSelection()).toBe(false);
        expect(canvas.getObjects()).toHaveLength(1);
      });

      it("removes the selected object, and undo brings it back", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END, "rect1");
        objectFromDrag(canvas, START, END, "rect2");
        canvas.setActiveObject(canvas.getObjects()[0]);

        sketch.removeSelected();
        expect(ids(canvas)).toEqual(["rect2"]);
        expect(sketch.hasSelection()).toBe(false);

        sketch.undo();
        expect(ids(canvas)).toEqual(["rect2", "rect1"]);
      });

      it("removes the object again on redo", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END, "rect1");
        canvas.setActiveObject(canvas.getObjects()[0]);
        sketch.removeSelected();
        sketch.undo();
        expect(ids(canvas)).toEqual(["rect1"]);

        sketch.redo();

        expect(ids(canvas)).toEqual([]);
      });

      it("removes every object of a multiple selection, one undo each", () => {
        const onObjectRemoved = jest.fn();
        const { sketch, canvas } = mount({
          tool: Tool.RECTANGLE,
          onObjectRemoved,
        });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END, "rect1");
        objectFromDrag(canvas, END, [80, 90], "rect2");
        objectFromDrag(canvas, START, END, "rect3");
        const [first, second] = canvas.getObjects();
        const left = second.left;
        canvas.setActiveObject(
          new fabric.ActiveSelection([first, second], { canvas })
        );

        sketch.removeSelected();
        expect(ids(canvas)).toEqual(["rect3"]);
        expect(onObjectRemoved).toHaveBeenCalledTimes(2);

        sketch.undo();
        sketch.undo();
        expect(ids(canvas).sort()).toEqual(["rect1", "rect2", "rect3"]);
        // the objects come back where they were, not relative to the selection
        expect(second.left).toEqual(left);
      });

      it("does nothing without a selection", () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);

        expect(() => sketch.removeSelected()).not.toThrow();

        expect(canvas.getObjects()).toHaveLength(1);
      });
    });

    describe("copy and paste", () => {
      it("copies the selected object and pastes it, a bit further", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END, "rect1");
        objectFromDrag(canvas, START, END, "rect2");
        canvas.setActiveObject(canvas.getObjects()[0]);
        expect(canvas.getObjects()).toHaveLength(2);

        sketch.copy();
        sketch.paste();
        await settle();

        expect(canvas.getObjects()).toHaveLength(3);
        const pasted = canvas.getObjects()[2];
        expect([pasted.left, pasted.top]).toEqual([START[0] + 10, START[1] + 10]);
        expect(canvas.getActiveObject()).toBe(pasted);
      });

      it("pastes further down on every paste", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END);
        canvas.setActiveObject(canvas.getObjects()[0]);
        sketch.copy();

        sketch.paste();
        sketch.paste();
        await settle();

        const [, first, second] = canvas.getObjects();
        expect(first.left).toEqual(START[0] + 10);
        expect(second.left).toEqual(START[0] + 20);
      });

      it("pastes a multiple selection", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END);
        objectFromDrag(canvas, END, [80, 90]);
        canvas.setActiveObject(
          new fabric.ActiveSelection(canvas.getObjects(), { canvas })
        );

        sketch.copy();
        sketch.paste();
        await settle();

        expect(canvas.getObjects()).toHaveLength(4);
      });

      it("can undo a paste", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, START, END);
        canvas.setActiveObject(canvas.getObjects()[0]);
        sketch.copy();
        sketch.paste();
        await settle();

        sketch.undo();

        expect(canvas.getObjects()).toHaveLength(1);
      });

      it("does nothing without a selection to copy, or without a copy to paste", async () => {
        const { sketch, canvas } = mount({ tool: Tool.RECTANGLE });
        objectFromDrag(canvas, START, END);

        expect(() => {
          sketch.paste();
          sketch.copy();
          sketch.paste();
        }).not.toThrow();
        await settle();

        expect(canvas.getObjects()).toHaveLength(1);
      });
    });

    describe("setBackgroundFromDataUrl", () => {
      /** An image loads as soon as its source is set */
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

      it("sets the image as the background of the canvas", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00");

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect(image).toBeInstanceOf(fabric.FabricImage);
        expect(image.scaleX).toEqual(1);
        expect(image.scaleY).toEqual(1);
      });

      it("stretches the image to the canvas", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretched: true,
        });

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect(image.scaleX).toEqual(canvas.getWidth() / 200);
        expect(image.scaleY).toEqual(canvas.getHeight() / 100);
      });

      it("stretches the image to a canvas of another shape", () => {
        stubImages();
        layout(400, 300);
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretched: true,
        });

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect([image.scaleX, image.scaleY]).toEqual([2, 3]);
      });

      it("stretches both ways when the width and the height are asked for", () => {
        stubImages();
        layout(400, 300);
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretchedX: true,
          stretchedY: true,
        });

        const image = canvas.backgroundImage as fabric.FabricImage;
        expect([image.scaleX, image.scaleY]).toEqual([2, 3]);
      });

      it("stretches the image to the width, or the height, only", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretchedX: true,
        });
        let image = canvas.backgroundImage as fabric.FabricImage;
        expect(image.scaleX).toEqual(canvas.getWidth() / 200);
        expect(image.scaleY).toEqual(canvas.getWidth() / 200);

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          stretchedY: true,
        });
        image = canvas.backgroundImage as fabric.FabricImage;
        expect(image.scaleX).toEqual(canvas.getHeight() / 100);
        expect(image.scaleY).toEqual(canvas.getHeight() / 100);
      });

      it("passes the other options to the image", () => {
        stubImages();
        const { sketch, canvas } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00", {
          opacity: 0.5,
        });

        expect((canvas.backgroundImage as fabric.FabricImage).opacity).toEqual(0.5);
      });

      it("sets nothing when the component was unmounted meanwhile", () => {
        let load: () => void = () => undefined;
        jest.spyOn(window, "Image").mockImplementation(() => {
          const img = document.createElement("img");
          Object.defineProperty(img, "src", {
            set: () => {
              load = () => img.onload?.(new Event("load"));
            },
          });
          return img;
        });
        const { sketch, canvas, unmount } = mount();
        const setBackgroundImage = jest.fn();
        Object.defineProperty(canvas, "backgroundImage", {
          configurable: true,
          get: () => undefined,
          set: setBackgroundImage,
        });
        sketch.setBackgroundFromDataUrl("data:image/png;base64,00");

        unmount();

        expect(load).not.toThrow();
        expect(setBackgroundImage).not.toHaveBeenCalled();
      });

      it("asks for the image anonymously", () => {
        const setAttribute = jest.spyOn(HTMLImageElement.prototype, "setAttribute");
        const { sketch } = mount();

        sketch.setBackgroundFromDataUrl("data:image/png;base64,00");

        expect(setAttribute).toHaveBeenCalledWith("crossOrigin", "anonymous");
      });

      describe("removeBackgroundImage", () => {
        it("removes the background image and keeps the objects", () => {
          stubImages();
          const { sketch, canvas } = mount();
          sketch.addText("hello");
          sketch.setBackgroundFromDataUrl("data:image/png;base64,00");
          expect(canvas.backgroundImage).toBeTruthy();

          sketch.removeBackgroundImage();

          expect(canvas.backgroundImage).toBeFalsy();
          expect(sketch.toJSON().backgroundImage).toBeUndefined();
          expect(canvas.getObjects()).toHaveLength(1);
        });

        it("does nothing when there is no background image", () => {
          const { sketch, canvas } = mount();

          expect(() => sketch.removeBackgroundImage()).not.toThrow();
          expect(canvas.backgroundImage).toBeFalsy();
        });

        it("keeps the image that is still loading from being set", () => {
          let load: () => void = () => undefined;
          jest.spyOn(window, "Image").mockImplementation(() => {
            const img = document.createElement("img");
            Object.defineProperty(img, "src", {
              set: () => {
                load = () => img.onload?.(new Event("load"));
              },
            });
            return img;
          });
          const { sketch, canvas } = mount();
          sketch.setBackgroundFromDataUrl("data:image/png;base64,00");

          sketch.removeBackgroundImage();
          load();

          expect(canvas.backgroundImage).toBeFalsy();
        });
      });
    });

    describe("addText", () => {
      it("adds a text at the center of the canvas", () => {
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;

        sketch.addText("hello", { fontSize: 20 });

        const [text] = canvas.getObjects() as fabric.IText[];
        expect(text.type).toEqual("i-text");
        expect(text.text).toEqual("hello");
        expect(text.fontSize).toEqual(20);
        expect(text.left).toEqual((canvas.getWidth() - (text.width ?? 0)) / 2);
        expect(text.top).toEqual((canvas.getHeight() - (text.height ?? 0)) / 2);
      });

      it("adds the text where it is asked to", () => {
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;

        sketch.addText("hello", { left: 11, top: 22 });

        const [text] = canvas.getObjects();
        expect([text.left, text.top]).toEqual([11, 22]);
      });

      it("does not change the options it is given", () => {
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;
        const options = { fontSize: 20 };

        sketch.addText("hello", options);

        expect(options).toEqual({ fontSize: 20 });
      });

      it("can be undone", () => {
        const { sketch, canvas } = mount();
        canvas.renderOnAddRemove = false;
        sketch.addText("hello");

        sketch.undo();

        expect(canvas.getObjects()).toHaveLength(0);
      });
    });
  });
});
