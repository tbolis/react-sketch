import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../SketchField";
import { SketchProperties, Tool } from "../../../types";

type Point = [number, number];

const mount = (props: SketchProperties = {}) => {
  const ref = createRef<SketchField>();
  const view = render(<SketchField ref={ref} {...props} />);
  const sketch = ref.current as SketchField;
  return {
    ...view,
    sketch,
    canvas: sketch["canvas"] as fabric.Canvas,
    update: (next: SketchProperties) =>
      view.rerender(<SketchField ref={ref} {...next} />),
  };
};

const fire = (canvas: fabric.Canvas, name: string, event: object): void =>
  (canvas as unknown as fabric.Observable<Record<string, object>>).fire(name, event);

const mouseEvent = (type: string, [x, y]: Point = [0, 0]): { e: MouseEvent } => ({
  e: new MouseEvent(type, { clientX: x, clientY: y }),
});

/** Draw with the tool of the sketch: press, move, release. Returns the objects on the canvas */
const draw = (
  canvas: fabric.Canvas,
  from: Point,
  to: Point
): fabric.FabricObject[] => {
  fire(canvas, "mouse:down", mouseEvent("mousedown", from));
  fire(canvas, "mouse:move", mouseEvent("mousemove", to));
  fire(canvas, "mouse:up", mouseEvent("mouseup", to));
  return canvas.getObjects();
};

/**
 * What the select tool does when the pointer moves the target: it is pressed, it
 * changes (the canvas tells that it moves, and then that it is modified), and the
 * pointer is released
 */
const change = (
  canvas: fabric.Canvas,
  target: fabric.FabricObject,
  props: Partial<fabric.FabricObjectProps>
): void => {
  fire(canvas, "mouse:down", { ...mouseEvent("mousedown", [5, 5]), target });
  target.set(props);
  target.setCoords();
  fire(canvas, "object:moving", { target });
  fire(canvas, "object:modified", { target });
  fire(canvas, "mouse:up", mouseEvent("mouseup", [5, 5]));
};

const moveBy = (
  canvas: fabric.Canvas,
  target: fabric.FabricObject,
  dx: number,
  dy: number
) =>
  change(canvas, target, {
    left: (target.left ?? 0) + dx,
    top: (target.top ?? 0) + dy,
  });

const stateOf = (object: fabric.FabricObject): string =>
  JSON.stringify(object.toJSON());

const centers = (objects: fabric.FabricObject[]): Point[] =>
  objects.map((object) => {
    const { x, y } = object.getCenterPoint();
    return [x, y];
  });

const expectCenters = (objects: fabric.FabricObject[], expected: Point[]): void =>
  objects.forEach((object, i) => {
    const [x, y] = centers([object])[0];
    expect(x).toBeCloseTo(expected[i][0], 3);
    expect(y).toBeCloseTo(expected[i][1], 3);
  });

describe("undo and redo of a modification", () => {
  describe("of an object of any tool", () => {
    const line = (...points: [number, number, number, number]) =>
      new fabric.Line(points, { stroke: "black", strokeWidth: 3 });

    const objects: [string, () => fabric.FabricObject][] = [
      ["a line going down to the right", () => line(50, 50, 150, 110)],
      ["a line going up to the right", () => line(50, 110, 150, 50)],
      ["a line going down to the left", () => line(150, 50, 50, 110)],
      ["a horizontal line", () => line(50, 80, 150, 80)],
      ["a vertical line", () => line(80, 50, 80, 150)],
      [
        "a rectangle",
        () =>
          new fabric.Rect({
            left: 40,
            top: 30,
            width: 90,
            height: 60,
            stroke: "red",
          }),
      ],
      ["a circle", () => new fabric.Circle({ left: 40, top: 30, radius: 40 })],
      [
        "a polygon",
        () =>
          new fabric.Polygon(
            [
              { x: 20, y: 90 },
              { x: 70, y: 10 },
              { x: 120, y: 90 },
            ],
            { stroke: "black" }
          ),
      ],
      [
        "a stroke of the pencil",
        () =>
          new fabric.Path("M 10 10 C 40 80, 90 -20, 140 60", {
            fill: "",
            stroke: "black",
          }),
      ],
      ["a text", () => new fabric.IText("some text", { left: 30, top: 40 })],
    ];

    describe.each(objects)("%s", (_name, create) => {
      const setup = () => {
        const view = mount({ tool: Tool.SELECT });
        // Another object, drawn after it, which undoing the move must not remove
        const object = create();
        view.canvas.add(object);
        view.canvas.add(
          new fabric.Rect({ left: 200, top: 200, width: 20, height: 20 })
        );
        return { ...view, object, original: stateOf(object) };
      };

      it("goes back to where it was", () => {
        const { sketch, canvas, object, original } = setup();

        moveBy(canvas, object, 120, 70);
        expect(stateOf(object)).not.toEqual(original);
        sketch.undo();

        expect(stateOf(object)).toEqual(original);
        expect(canvas.getObjects()).toHaveLength(2);
      });

      it("is moved again by redo", () => {
        const { sketch, canvas, object } = setup();
        moveBy(canvas, object, 120, 70);
        const moved = stateOf(object);

        sketch.undo();
        sketch.redo();

        expect(stateOf(object)).toEqual(moved);
        expect(canvas.getObjects()).toHaveLength(2);
      });

      it("is one step: the other object stays", () => {
        const { sketch, canvas, object } = setup();
        moveBy(canvas, object, 120, 70);

        sketch.undo();

        expect(canvas.getObjects()).toContain(object);
        expect(canvas.getObjects()[1].type).toBe("rect");
        expect(sketch.canUndo()).toBe(true);
      });

      it("is scaled and rotated back, and forth", () => {
        const { sketch, canvas, object, original } = setup();

        change(canvas, object, { scaleX: 1.5, scaleY: 0.5, angle: 30 });
        const turned = stateOf(object);
        sketch.undo();
        expect(stateOf(object)).toEqual(original);
        sketch.redo();

        expect(stateOf(object)).toEqual(turned);
      });
    });

    it("keeps a line where the user left it, not at the origin of the canvas", () => {
      const { sketch, canvas, update } = mount({ tool: Tool.LINE });
      const [drawn] = draw(canvas, [50, 50], [150, 110]);
      update({ tool: Tool.SELECT });
      const center = centers([drawn])[0];

      moveBy(canvas, drawn, 300, 200);
      sketch.undo();

      expectCenters([drawn], [center]);
      expect(center[0]).toBeGreaterThan(50);
      sketch.redo();
      expectCenters([drawn], [[center[0] + 300, center[1] + 200]]);
    });

    it("keeps an arrow where the user left it", () => {
      const { sketch, canvas, update } = mount({ tool: Tool.ARROW });
      const [drawn] = draw(canvas, [50, 50], [150, 110]);
      update({ tool: Tool.SELECT });
      const original = stateOf(drawn);

      moveBy(canvas, drawn, 120, 70);
      expect(stateOf(drawn)).not.toEqual(original);
      sketch.undo();

      expect(stateOf(drawn)).toEqual(original);
      expect(canvas.getObjects()).toEqual([drawn]);
    });
  });

  describe("of an object which is not as it was when it was added", () => {
    it("goes back to the state before the press, and not to the one it had when it was added", () => {
      const { sketch, canvas } = mount({ tool: Tool.SELECT });
      const rect = new fabric.Rect({ left: 10, top: 10, width: 30, height: 30 });
      canvas.add(rect);
      // Changed by something which the history does not see
      rect.set({ left: 100 });

      moveBy(canvas, rect, 50, 0);
      sketch.undo();

      expect(rect.left).toBe(100);
    });

    it("is not an action when it changed nothing", () => {
      const { sketch, canvas } = mount({ tool: Tool.SELECT });
      const rect = new fabric.Rect({ left: 10, top: 10, width: 30, height: 30 });
      canvas.add(rect);

      change(canvas, rect, {});
      sketch.undo();

      // The only action is the addition of the rectangle
      expect(canvas.getObjects()).toHaveLength(0);
      expect(sketch.canUndo()).toBe(false);
    });

    it("is undone when it was made by code, without the press of the pointer", () => {
      const { sketch, canvas } = mount({ tool: Tool.SELECT });
      const rect = new fabric.Rect({ left: 10, top: 10, width: 30, height: 30 });
      canvas.add(rect);

      rect.set({ left: 90 });
      fire(canvas, "object:modified", { target: rect });
      sketch.undo();

      expect(rect.left).toBe(10);
    });

    it("is undone for an object which was loaded with the value", async () => {
      jest.useFakeTimers();
      const loaded = new fabric.Line([50, 50, 150, 110], { stroke: "black" });
      const { sketch, canvas } = mount({
        tool: Tool.SELECT,
        defaultValue: { objects: [loaded.toObject()] },
      });
      await jest.advanceTimersByTimeAsync(100);
      const [line] = canvas.getObjects();
      const original = stateOf(line);

      moveBy(canvas, line, 120, 70);
      expect(stateOf(line)).not.toEqual(original);
      sketch.undo();

      expect(stateOf(line)).toEqual(original);
      expect(canvas.getObjects()).toHaveLength(1);
      jest.useRealTimers();
    });
  });

  describe("of a rectangle with a label", () => {
    const setup = () => {
      const view = mount({ tool: Tool.RECTANGLE_LABEL });
      const [rect, textbox] = draw(view.canvas, [50, 80], [250, 200]);
      view.update({ tool: Tool.SELECT });
      return { ...view, rect, textbox, original: [stateOf(rect), stateOf(textbox)] };
    };

    it("is a rectangle which has its size, and not the one of the press which drew it", () => {
      const { sketch, rect, canvas } = setup();

      moveBy(canvas, rect, 100, 40);
      sketch.undo();

      expect(rect.width).toBe(200);
      expect(rect.height).toBe(120);
    });

    it("puts the rectangle and its text box back where they were", () => {
      const { sketch, canvas, rect, textbox, original } = setup();

      moveBy(canvas, rect, 100, 40);
      // The text box follows the rectangle when it is moved
      expect(stateOf(textbox)).not.toEqual(original[1]);
      sketch.undo();

      expect([stateOf(rect), stateOf(textbox)]).toEqual(original);
    });

    it("moves them again with redo", () => {
      const { sketch, canvas, rect, textbox } = setup();
      moveBy(canvas, rect, 100, 40);
      const moved = [stateOf(rect), stateOf(textbox)];

      sketch.undo();
      sketch.redo();

      expect([stateOf(rect), stateOf(textbox)]).toEqual(moved);
    });

    it("puts the text box back when it was moved on its own", () => {
      const { sketch, canvas, textbox, original } = setup();

      moveBy(canvas, textbox, 0, -30);
      sketch.undo();

      expect(stateOf(textbox)).toEqual(original[1]);
    });
  });

  describe("of a selection of many objects", () => {
    const setup = () => {
      const view = mount({ tool: Tool.SELECT });
      const line = new fabric.Line([50, 50, 150, 110], {
        stroke: "black",
        strokeWidth: 3,
      });
      const rect = new fabric.Rect({
        left: 80,
        top: 160,
        width: 100,
        height: 50,
        stroke: "red",
      });
      const last = new fabric.Circle({ left: 300, top: 40, radius: 20 });
      view.canvas.add(line, rect, last);
      const selection = new fabric.ActiveSelection([line, rect], {
        canvas: view.canvas,
      });
      view.canvas.setActiveObject(selection);
      return {
        ...view,
        line,
        rect,
        last,
        selection,
        members: [line, rect],
        at: centers([line, rect]),
      };
    };

    it("puts all of them back where they were with one undo, and removes none", () => {
      const { sketch, canvas, selection, members, last, at } = setup();

      moveBy(canvas, selection, 150, 90);
      expectCenters(
        members,
        at.map(([x, y]) => [x + 150, y + 90])
      );
      sketch.undo();

      expectCenters(members, at);
      expect(canvas.getObjects()).toHaveLength(3);
      expect(canvas.getObjects()).toContain(last);
    });

    it("moves all of them again with redo", () => {
      const { sketch, canvas, selection, members, at } = setup();
      moveBy(canvas, selection, 150, 90);

      sketch.undo();
      sketch.redo();

      expectCenters(
        members,
        at.map(([x, y]) => [x + 150, y + 90])
      );
    });

    it("is one action, so the next undo goes to the one before", () => {
      const { sketch, canvas, selection, members, at, last } = setup();
      moveBy(canvas, selection, 150, 90);

      sketch.undo();
      sketch.undo();

      // The circle was the last object added
      expect(canvas.getObjects()).not.toContain(last);
      expectCenters(members, at);
    });

    it("gives the objects the position of the canvas when it goes back, and leaves the selection", () => {
      const { sketch, canvas, selection, members } = setup();
      moveBy(canvas, selection, 150, 90);

      sketch.undo();

      expect(canvas.getActiveObject()).toBeUndefined();
      members.forEach((member) => expect(member.group).toBeUndefined());
    });

    it("is scaled and rotated back, and forth", () => {
      const { sketch, canvas, selection, members, at } = setup();

      change(canvas, selection, { scaleX: 1.6, scaleY: 0.7, angle: 35 });
      const turned = members.map((member) => {
        const { x, y } = member.getCenterPoint();
        return [x, y, member.getTotalAngle()];
      });
      sketch.undo();
      expectCenters(members, at);
      members.forEach((member) => expect(member.getTotalAngle()).toBeCloseTo(0, 3));
      sketch.redo();

      members.forEach((member, i) => {
        const { x, y } = member.getCenterPoint();
        expect([x, y, member.getTotalAngle()]).toEqual(
          turned[i].map((value) => expect.closeTo(value, 3))
        );
      });
    });

    it("tells the application that the objects changed, once", () => {
      const onObjectModified = jest.fn();
      const view = mount({ tool: Tool.SELECT, onObjectModified });
      const a = new fabric.Rect({ left: 10, top: 10, width: 20, height: 20 });
      const b = new fabric.Rect({ left: 60, top: 10, width: 20, height: 20 });
      view.canvas.add(a, b);
      const selection = new fabric.ActiveSelection([a, b], { canvas: view.canvas });
      view.canvas.setActiveObject(selection);

      moveBy(view.canvas, selection, 20, 20);

      expect(onObjectModified).toHaveBeenCalledTimes(1);
      expect(onObjectModified.mock.calls[0][0].target).toBe(selection);
    });

    it("is recorded for the objects it knows only", () => {
      const view = mount({ tool: Tool.SELECT });
      const known = new fabric.Rect({ left: 10, top: 10, width: 20, height: 20 });
      view.canvas.add(known);
      const stranger = new fabric.Rect({ left: 60, top: 10, width: 20, height: 20 });
      // Not on the canvas, so the history never saw it
      const selection = new fabric.ActiveSelection([known, stranger], {
        canvas: view.canvas,
      });
      view.canvas.setActiveObject(selection);
      const at = centers([known]);

      moveBy(view.canvas, selection, 30, 30);
      view.sketch.undo();

      expectCenters([known], at);
    });
  });
});
