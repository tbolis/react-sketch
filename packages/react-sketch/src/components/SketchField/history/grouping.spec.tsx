import { createRef } from "react";
import { render } from "@testing-library/react";
import * as fabric from "fabric";
import SketchField from "../SketchField";
import { SketchGroup } from "../SketchGroup";
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

/** What the select tool does when the pointer changes the target */
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

/** Where the center of the object is on the canvas, also for the object of a group */
const centerOf = (object: fabric.FabricObject): Point => {
  const { x, y } = object.group
    ? fabric.util.transformPoint(
        object.getRelativeCenterPoint(),
        object.group.calcTransformMatrix()
      )
    : object.getCenterPoint();
  return [x, y];
};

const expectCenters = (objects: fabric.FabricObject[], expected: Point[]): void =>
  objects.forEach((object, i) => {
    const [x, y] = centerOf(object);
    expect(x).toBeCloseTo(expected[i][0], 3);
    expect(y).toBeCloseTo(expected[i][1], 3);
  });

/** Four objects drawn in this order, and the ones of the second and the fourth selected */
const setup = (props: SketchProperties = {}) => {
  const view = mount({ tool: Tool.SELECT, ...props });
  const a = new fabric.Line([50, 50, 150, 110], { stroke: "black", strokeWidth: 3 });
  const b = new fabric.Rect({ left: 300, top: 20, width: 40, height: 40 });
  const c = new fabric.Rect({
    left: 80,
    top: 160,
    width: 100,
    height: 50,
    stroke: "red",
  });
  const d = new fabric.Circle({ left: 300, top: 200, radius: 20 });
  view.canvas.add(a, b, c, d);
  const select = (...objects: fabric.FabricObject[]) => {
    view.canvas.setActiveObject(
      new fabric.ActiveSelection(objects, { canvas: view.canvas })
    );
  };
  select(a, c);
  return { ...view, a, b, c, d, select, at: [a, b, c, d].map(centerOf) };
};

describe("group and ungroup", () => {
  describe("canGroup and canUngroup", () => {
    it("need two objects selected to group, and a group to ungroup", () => {
      const { sketch, canvas, a, select } = setup();
      expect([sketch.canGroup(), sketch.canUngroup()]).toEqual([true, false]);

      canvas.discardActiveObject();
      expect(sketch.canGroup()).toBe(false);

      canvas.setActiveObject(a);
      expect([sketch.canGroup(), sketch.canUngroup()]).toEqual([false, false]);

      select(a, canvas.getObjects()[1]);
      sketch.group();
      expect([sketch.canGroup(), sketch.canUngroup()]).toEqual([false, true]);
    });

    it("do not take the group of an arrow for one which can be taken apart", () => {
      const { sketch, canvas, a, d } = setup();
      const arrow = new fabric.Group([a, d]);
      canvas.add(arrow);
      canvas.setActiveObject(arrow);

      expect(sketch.canUngroup()).toBe(false);
      sketch.ungroup();
      expect(canvas.getObjects()).toContain(arrow);
      expect(arrow.getObjects()).toHaveLength(2);
    });
  });

  describe("group", () => {
    it("makes one group of the selected objects, which is selected", () => {
      const { sketch, canvas, a, c } = setup();

      sketch.group();

      const group = canvas.getActiveObject();
      expect(group).toBeInstanceOf(SketchGroup);
      expect((group as SketchGroup).getObjects()).toEqual([a, c]);
    });

    it("keeps the objects where they are on the canvas", () => {
      const { sketch, a, c, at } = setup();

      sketch.group();

      expectCenters([a, c], [at[0], at[2]]);
    });

    it("takes the place of the topmost object, so what is above it stays above", () => {
      const { sketch, canvas, b, d } = setup();

      sketch.group();

      const objects = canvas.getObjects();
      expect(objects).toHaveLength(3);
      expect(objects[0]).toBe(b);
      expect(objects[1]).toBeInstanceOf(SketchGroup);
      expect(objects[2]).toBe(d);
    });

    it("keeps the order of the canvas for the objects of the group, whatever the order of the selection", () => {
      const { sketch, a, c, select } = setup();
      select(c, a);

      sketch.group();

      expect(
        (sketch["canvas"].getActiveObject() as SketchGroup).getObjects()
      ).toEqual([a, c]);
    });

    it("is one undo step, which puts the objects back, in their places, and selects nothing", () => {
      const { sketch, canvas, a, b, c, d, at } = setup();

      sketch.group();
      sketch.undo();

      expect(canvas.getObjects()).toEqual([a, b, c, d]);
      expectCenters([a, b, c, d], at);
      expect(canvas.getActiveObject()).toBeUndefined();
      expect(a.group).toBeUndefined();
    });

    it("is put back by redo, as the same group", () => {
      const { sketch, canvas, a, c, at } = setup();

      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;
      const state = JSON.stringify(group.toJSON());
      sketch.undo();
      sketch.redo();

      expect(canvas.getObjects()[1]).toBe(group);
      expect(group.getObjects()).toEqual([a, c]);
      expectCenters([a, c], [at[0], at[2]]);
      expect(JSON.parse(JSON.stringify(group.toJSON()))).toMatchObject({
        left: expect.closeTo(JSON.parse(state).left, 3),
        top: expect.closeTo(JSON.parse(state).top, 3),
        width: expect.closeTo(JSON.parse(state).width, 3),
        height: expect.closeTo(JSON.parse(state).height, 3),
      });
    });

    it("does nothing without two objects selected", () => {
      const onChange = jest.fn();
      const { sketch, canvas, a, b, c, d } = setup({ onChange });
      canvas.discardActiveObject();

      sketch.group();
      canvas.setActiveObject(a);
      sketch.group();

      expect(canvas.getObjects()).toEqual([a, b, c, d]);
      expect(onChange).not.toHaveBeenCalled();
      expect(sketch.canUndo()).toBe(true);
      sketch.undo();
      expect(canvas.getObjects()).toEqual([a, b, c]);
    });

    it("calls onChange, and does not announce the group as an object added by the user", () => {
      const onChange = jest.fn();
      const onObjectAdded = jest.fn();
      const { sketch } = setup({ onChange, onObjectAdded });
      onObjectAdded.mockClear();

      sketch.group();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onObjectAdded).not.toHaveBeenCalled();
    });

    it("is not an action of the history when the objects were not drawn on it", () => {
      const { sketch, canvas } = setup();

      sketch.group();
      sketch.undo();
      sketch.undo();

      // Only the last object drawn went: the group was one step
      expect(canvas.getObjects()).toHaveLength(3);
    });
  });

  describe("a group which is changed", () => {
    it("is moved, undone and redone as one object", () => {
      const { sketch, canvas, a, c, at } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;

      moveBy(canvas, group, 120, 80);
      expectCenters(
        [a, c],
        [at[0], at[2]].map(([x, y]) => [x + 120, y + 80])
      );
      sketch.undo();
      expectCenters([a, c], [at[0], at[2]]);
      sketch.redo();
      expectCenters(
        [a, c],
        [at[0], at[2]].map(([x, y]) => [x + 120, y + 80])
      );
    });

    it("keeps its modifications when it is taken apart and put together again, by undo", () => {
      const { sketch, canvas, a, c, at } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;
      moveBy(canvas, group, 120, 80);
      const moved = [a, c].map(centerOf);

      sketch.ungroup();
      sketch.undo();

      expect(canvas.getObjects()).toContain(group);
      expectCenters([a, c], moved);
      // The move is still undone by the group it was made on
      sketch.undo();
      expectCenters([a, c], [at[0], at[2]]);
      expect(canvas.getObjects()[1]).toBe(group);
      // And the group itself
      sketch.undo();
      expectCenters([a, c], [at[0], at[2]]);
      expect(a.group).toBeUndefined();
    });

    it("keeps its modifications when it is put together again by redo", () => {
      const { sketch, canvas, a, c, at } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;
      moveBy(canvas, group, 120, 80);
      const moved = [a, c].map(centerOf);

      sketch.undo();
      sketch.undo();
      expectCenters([a, c], [at[0], at[2]]);
      sketch.redo();
      sketch.redo();

      expect(canvas.getObjects()[1]).toBe(group);
      expectCenters([a, c], moved);
    });
  });

  describe("ungroup", () => {
    it("takes the group apart, where its objects were, and selects them", () => {
      const { sketch, canvas, a, b, c, d, at } = setup();
      sketch.group();

      sketch.ungroup();

      expect(canvas.getObjects()).toEqual([b, a, c, d]);
      expectCenters([a, c], [at[0], at[2]]);
      const selected = canvas.getActiveObject();
      expect(selected).toBeInstanceOf(fabric.ActiveSelection);
      expect((selected as fabric.ActiveSelection).getObjects()).toEqual([a, c]);
      expect(sketch.canGroup()).toBe(true);
    });

    it("gives the objects the move, the scale and the turn of the group", () => {
      const { sketch, canvas, a, c } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;
      change(canvas, group, {
        left: 400,
        top: 300,
        scaleX: 1.5,
        scaleY: 0.8,
        angle: 30,
      });
      const shown = [a, c].map(centerOf);

      sketch.ungroup();

      expectCenters([a, c], shown);
      // Leaving the selection gives the objects their own place
      canvas.discardActiveObject();
      expect(a.group).toBeUndefined();
      expect(a.angle).toBeCloseTo(30, 3);
      expect(a.scaleX).toBeCloseTo(1.5, 3);
      expectCenters([a, c], shown);
    });

    it("is one undo step, which makes the group again, and redo takes it apart again", () => {
      const { sketch, canvas, a, b, c, d, at } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;

      sketch.ungroup();
      sketch.undo();
      expect(canvas.getObjects()).toEqual([b, group, d]);
      expect(group.getObjects()).toEqual([a, c]);
      expectCenters([a, c], [at[0], at[2]]);

      sketch.redo();
      expect(canvas.getObjects()).toEqual([b, a, c, d]);
      expectCenters([a, c], [at[0], at[2]]);
    });

    it("takes only the group apart, when it holds another one", () => {
      const { sketch, canvas, a, b, c, d, select } = setup();
      sketch.group();
      const inner = canvas.getActiveObject() as SketchGroup;
      select(inner, b);
      sketch.group();
      const outer = canvas.getActiveObject() as SketchGroup;
      expect(outer.getObjects()).toEqual([b, inner]);

      sketch.ungroup();

      expect(canvas.getObjects()).toEqual([b, inner, d]);
      expect(inner.getObjects()).toEqual([a, c]);
    });

    it("calls onChange", () => {
      const onChange = jest.fn();
      const { sketch } = setup({ onChange });
      sketch.group();
      onChange.mockClear();

      sketch.ungroup();

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("a group among the objects of the sketch", () => {
    it("is saved with its type, and loaded as a group which can be taken apart", async () => {
      const { sketch, canvas, a, c } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;

      const json = JSON.parse(JSON.stringify(group.toObject()));
      expect(json.type).toBe("SketchGroup");
      const [loaded] = await fabric.util.enlivenObjects([json]);

      expect(loaded).toBeInstanceOf(SketchGroup);
      expect((loaded as SketchGroup).getObjects()).toHaveLength(2);
      expect((loaded as SketchGroup).getObjects()[0]).toBeInstanceOf(fabric.Line);
      expect([a, c]).toHaveLength(2);
    });

    it("is copied as a group", async () => {
      const { sketch, canvas } = setup();
      sketch.group();

      const copy = await (canvas.getActiveObject() as SketchGroup).clone();

      expect(copy).toBeInstanceOf(SketchGroup);
    });

    it("is removed as one object, and comes back with undo", () => {
      const { sketch, canvas, b, d } = setup();
      sketch.group();
      const group = canvas.getActiveObject() as SketchGroup;

      sketch.removeSelected();
      expect(canvas.getObjects()).toEqual([b, d]);
      sketch.undo();

      expect(canvas.getObjects()).toContain(group);
      expect(group.getObjects()).toHaveLength(2);
    });
  });

  describe("a rectangle with a label", () => {
    it("is grouped with its text box, which follows it", () => {
      const view = mount({ tool: Tool.RECTANGLE_LABEL });
      const [rect, textbox] = draw(view.canvas, [50, 80], [250, 200]);
      view.update({ tool: Tool.SELECT });
      const other = new fabric.Circle({ left: 400, top: 300, radius: 20 });
      view.canvas.add(other);
      const at = [rect, textbox, other].map(centerOf);
      view.canvas.setActiveObject(
        new fabric.ActiveSelection([rect, other], { canvas: view.canvas })
      );

      view.sketch.group();

      const group = view.canvas.getActiveObject() as SketchGroup;
      expect(group.getObjects()).toEqual([rect, textbox, other]);
      expectCenters([rect, textbox, other], at);

      view.sketch.undo();
      expect(view.canvas.getObjects()).toEqual([rect, textbox, other]);
      expectCenters([rect, textbox, other], at);
    });
  });
});
