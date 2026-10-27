import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import { EraserBrush } from "@erase2d/fabric";
import SketchField from "../../SketchField";
import { SketchProperties, Tool, Tools } from "../../../../types";

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} tool={Tool.ERASER} {...props} />);
  const sketch = ref.current as SketchField;
  return { ...view, sketch, canvas: sketch["canvas"] as fabric.Canvas };
};

const rect = () =>
  new fabric.Rect({
    left: 10,
    top: 10,
    width: 100,
    height: 100,
    originX: "left",
    originY: "top",
    fill: "red",
  });

/** Erase with one stroke from `from` to `to`, and wait for it to be committed */
const stroke = async (
  canvas: fabric.Canvas,
  from: [number, number],
  to: [number, number]
): Promise<void> => {
  const brush = canvas.freeDrawingBrush as EraserBrush;
  const at = ([x, y]: [number, number]) => new fabric.Point(x, y);
  const event = (type: string) => ({ e: new MouseEvent(type) }) as never;
  brush.onMouseDown(at(from), event("mousedown"));
  brush.onMouseMove(at([(from[0] + to[0]) / 2, from[1]]), event("mousemove"));
  brush.onMouseMove(at(to), event("mousemove"));
  brush.onMouseUp(event("mouseup"));
  await new Promise((resolve) => setTimeout(resolve, 20));
};

describe("Eraser", () => {
  it("is a tool of the component, with the legacy name", () => {
    expect(Tools.Eraser).toEqual(Tool.ERASER);
  });

  it("draws with an eraser brush of the width of the line", () => {
    const { canvas } = mount({ lineWidth: 24 });

    expect(canvas.isDrawingMode).toBe(true);
    expect(canvas.freeDrawingBrush).toBeInstanceOf(EraserBrush);
    expect(canvas.freeDrawingBrush?.width).toEqual(24);
  });

  it("follows the line width when it changes", () => {
    const { canvas, rerender } = mount({ lineWidth: 24 });

    rerender(<SketchField tool={Tool.ERASER} lineWidth={40} />);

    expect(canvas.freeDrawingBrush?.width).toEqual(40);
  });

  it("gives the pencil its own brush again, when the tool changes", () => {
    const { canvas, rerender } = mount();

    rerender(<SketchField tool={Tool.PENCIL} />);

    expect(canvas.freeDrawingBrush).toBeInstanceOf(fabric.PencilBrush);
    expect(canvas.freeDrawingBrush).not.toBeInstanceOf(EraserBrush);
  });

  it("marks the added objects as erasable, the loaded ones too", () => {
    const { canvas } = mount();
    const added = rect();

    canvas.add(added);

    expect((added as unknown as { erasable: boolean }).erasable).toBe(true);
  });

  describe("a stroke", () => {
    it("erases a part of the object it crosses", async () => {
      const { canvas } = mount({ lineWidth: 20 });
      const object = rect();
      canvas.add(object);

      await stroke(canvas, [30, 50], [90, 50]);

      expect(object.clipPath?.type).toEqual("clipping");
      expect(canvas.getObjects()).toEqual([object]);
    });

    it("leaves alone an object it does not cross", async () => {
      const { canvas } = mount({ lineWidth: 20 });
      const object = rect();
      canvas.add(object);

      await stroke(canvas, [150, 150], [190, 150]);

      expect(object.clipPath).toBeUndefined();
    });

    it("is one undo step, and redo erases again", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      const object = rect();
      canvas.add(object);
      await stroke(canvas, [30, 50], [90, 50]);
      expect(sketch.canUndo()).toBe(true);

      sketch.undo();
      expect(object.clipPath).toBeUndefined();

      sketch.redo();
      expect(object.clipPath?.type).toEqual("clipping");

      // Undo twice goes back past the stroke, to the object being added
      sketch.undo();
      sketch.undo();
      expect(canvas.getObjects()).toEqual([]);
    });

    it("undoes the strokes one by one on the same object", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      const object = rect();
      canvas.add(object);
      await stroke(canvas, [30, 30], [90, 30]);
      await stroke(canvas, [30, 80], [90, 80]);
      const group = object.clipPath as fabric.Group;
      expect(group.size()).toEqual(2);

      sketch.undo();
      expect((object.clipPath as fabric.Group).size()).toEqual(1);

      sketch.undo();
      expect(object.clipPath).toBeUndefined();

      sketch.redo();
      sketch.redo();
      expect((object.clipPath as fabric.Group).size()).toEqual(2);
    });

    it("calls onChange", async () => {
      const onChange = jest.fn();
      const { canvas } = mount({ lineWidth: 20, onChange });
      canvas.add(rect());

      await stroke(canvas, [30, 50], [90, 50]);

      expect(onChange).toHaveBeenCalled();
    });
  });

  it("is saved by toJSON and comes back with fromJSON", async () => {
    const { canvas, sketch } = mount({ lineWidth: 20 });
    canvas.add(rect());
    await stroke(canvas, [30, 50], [90, 50]);
    const saved = JSON.parse(JSON.stringify(sketch.toJSON()));
    expect(saved.objects[0].clipPath.type).toEqual("clipping");

    const [loaded] = await fabric.util.enlivenObjects<fabric.FabricObject>(
      saved.objects
    );

    expect(loaded.clipPath?.type).toEqual("clipping");
  });

  describe("with several objects and actions", () => {
    it("is one undo step for a stroke over several objects", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      const first = rect();
      const second = rect();
      second.set({ left: 130 });
      canvas.add(first, second);

      await stroke(canvas, [30, 50], [190, 50]);
      expect(first.clipPath?.type).toEqual("clipping");
      expect(second.clipPath?.type).toEqual("clipping");

      sketch.undo();
      expect(first.clipPath).toBeUndefined();
      expect(second.clipPath).toBeUndefined();

      sketch.redo();
      expect(first.clipPath?.type).toEqual("clipping");
      expect(second.clipPath?.type).toEqual("clipping");
    });

    it.each([
      [
        "a circle",
        () =>
          new fabric.Circle({
            left: 10,
            top: 10,
            radius: 50,
            originX: "left",
            originY: "top",
          }),
      ],
      [
        "a path, as the pencil draws",
        () =>
          new fabric.Path("M 10 50 L 110 50", {
            stroke: "black",
            strokeWidth: 30,
            fill: "",
          }),
      ],
      [
        "a text",
        () =>
          new fabric.Textbox("Hello", {
            left: 10,
            top: 10,
            width: 200,
            fontSize: 80,
            originX: "left",
            originY: "top",
          }),
      ],
    ])("erases %s, and undo and redo work", async (_name, create) => {
      const { canvas, sketch } = mount({ lineWidth: 10 });
      const object = create();
      canvas.add(object);

      await stroke(canvas, [40, 55], [70, 55]);
      expect(object.clipPath?.type).toEqual("clipping");

      sketch.undo();
      expect(object.clipPath).toBeUndefined();

      sketch.redo();
      expect(object.clipPath?.type).toEqual("clipping");
    });

    it("drops the redo of an undone stroke when a new stroke is made", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      canvas.add(rect());
      await stroke(canvas, [30, 30], [90, 30]);
      sketch.undo();
      expect(sketch.canRedo()).toBe(true);

      await stroke(canvas, [30, 70], [90, 70]);

      expect(sketch.canRedo()).toBe(false);
    });

    it("drops the redo of an undone stroke when an object is added", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      canvas.add(rect());
      await stroke(canvas, [30, 30], [90, 30]);
      sketch.undo();

      canvas.add(rect());

      expect(sketch.canRedo()).toBe(false);
    });

    it("keeps no history after clear(), the erased parts are gone with the objects", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      canvas.add(rect());
      await stroke(canvas, [30, 50], [90, 50]);

      sketch.clear();

      expect(canvas.getObjects()).toEqual([]);
      expect(sketch.canUndo()).toBe(false);
      sketch.undo();
      expect(canvas.getObjects()).toEqual([]);
    });

    it("counts a stroke as a step of the undo limit", async () => {
      const { canvas, sketch } = mount({ lineWidth: 10, undoSteps: 2 });
      const object = rect();
      canvas.add(object);
      for (const y of [20, 40, 60, 80]) await stroke(canvas, [30, y], [90, y]);
      expect((object.clipPath as fabric.Group).size()).toEqual(4);

      while (sketch.canUndo()) sketch.undo();

      // The oldest stroke is out of the history, it cannot be undone
      expect((object.clipPath as fabric.Group).size()).toEqual(1);
    });

    it("keeps the clip path an object had, when its stroke is undone", async () => {
      const { canvas, sketch } = mount({ lineWidth: 20 });
      const object = rect();
      const own = new fabric.Rect({
        width: 80,
        height: 80,
        absolutePositioned: false,
      });
      object.clipPath = own;
      canvas.add(object);

      await stroke(canvas, [30, 50], [90, 50]);
      sketch.undo();

      const group = object.clipPath as fabric.Group;
      expect(group).toBeDefined();
      expect(group.getObjects()).toContain(own);
    });
  });

  it("is loaded with the component, from a value saved by toJSON", async () => {
    const first = mount({ lineWidth: 20 });
    first.canvas.add(rect());
    await stroke(first.canvas, [30, 50], [90, 50]);
    const saved = JSON.parse(JSON.stringify(first.sketch.toJSON()));
    first.unmount();

    jest.useFakeTimers();
    try {
      const { canvas, sketch } = mount({ lineWidth: 20, defaultValue: saved });
      await jest.advanceTimersByTimeAsync(200);
      const [loaded] = canvas.getObjects();

      expect(loaded.clipPath?.type).toEqual("clipping");
      expect((loaded as unknown as { erasable: boolean }).erasable).toBe(true);
      // The loaded object can be erased more
      jest.useRealTimers();
      await stroke(canvas, [30, 70], [90, 70]);
      expect((loaded.clipPath as fabric.Group).size()).toEqual(2);
      sketch.undo();
      expect((loaded.clipPath as fabric.Group).size()).toEqual(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not record a stroke which ends after the component is unmounted", async () => {
    const onChange = jest.fn();
    const { canvas, sketch, unmount } = mount({ lineWidth: 20, onChange });
    canvas.add(rect());
    const history = sketch["history"];
    const onErased = jest.spyOn(history, "onErased");

    const ending = stroke(canvas, [30, 50], [90, 50]);
    unmount();
    await ending;

    expect(onErased).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
