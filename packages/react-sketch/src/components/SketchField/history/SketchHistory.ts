import * as fabric from "fabric";
import { UndoHistory } from "./index";
import type { Erasure } from "../tools/Eraser";
import { linkedObjects } from "../tools/RectangleLabel/RectangleLabelObject";

/**
 * What a modification did to an object: its state (as JSON) before and after it
 */
interface Change {
  object: fabric.FabricObject;
  before: string;
  after: string;
}

/**
 * One undoable action of the sketch. A modification can be of many objects, as
 * the ones of a selection which is moved.
 */
type HistoryEntry =
  | { action: "add"; object: fabric.FabricObject }
  | { action: "remove"; object: fabric.FabricObject }
  | { action: "modify"; changes: Change[] }
  | { action: "erase"; erasures: Erasure[] };

/**
 * Properties of the serialized state which are not restored: the type cannot
 * be set, and the others hold nested objects which the canvas builds itself
 */
const NOT_RESTORED = ["type", "version", "objects", "layoutManager", "clipPath"];

/** State of an object, as JSON string */
const stateOf = (object: fabric.FabricObject): string =>
  JSON.stringify(object.toJSON());

/** The properties which say where an object is, and how it is turned and scaled */
const PLACEMENT = [
  "left",
  "top",
  "scaleX",
  "scaleY",
  "angle",
  "skewX",
  "skewY",
  "flipX",
  "flipY",
] as const;

/**
 * State of an object as it is on the canvas on its own. The object of a
 * selection has its place relative to the selection (its `left` and `top` are
 * not the ones of the canvas), so the transform of the selection is applied to
 * it for the state, and then it is put back as it was.
 */
const stateOutsideGroup = (object: fabric.FabricObject): string => {
  const { group } = object;
  if (!group) return stateOf(object);
  const own = Object.fromEntries(PLACEMENT.map((key) => [key, object[key]]));
  fabric.util.addTransformToObject(object, group.calcTransformMatrix());
  try {
    return stateOf(object);
  } finally {
    object.set(own);
    object.setCoords();
  }
};

/**
 * The objects which a press or a modification is about: the ones of a selection, or the
 * one object, and the objects which follow them (the pointer moves the text box of a
 * label with its rectangle, and nothing tells the history)
 */
const objectsOf = (target: fabric.FabricObject): fabric.FabricObject[] => {
  const objects =
    target instanceof fabric.ActiveSelection ? target.getObjects() : [target];
  return [
    ...new Set(objects.flatMap((object) => [object, ...linkedObjects(object)])),
  ];
};

/**
 * The properties of `state` which are not the ones of `other`: what a modification
 * changed, as undo and redo set nothing else. Setting all of them is not harmless:
 * a line has its points relative to its center, and the canvas takes them for the
 * ones of the canvas when they are set, so the line is moved to the origin.
 */
const changedProps = (state: string, other: string): Record<string, unknown> => {
  const props = JSON.parse(state);
  const others = JSON.parse(other);
  NOT_RESTORED.forEach((key) => delete props[key]);
  Object.keys(props).forEach((key) => {
    if (JSON.stringify(props[key]) === JSON.stringify(others[key]))
      delete props[key];
  });
  return props;
};

/**
 * Records what happens to the objects of a canvas (added, modified, removed)
 * and applies undo and redo on them.
 */
export class SketchHistory {
  private readonly canvas: fabric.Canvas;
  private readonly entries: UndoHistory<HistoryEntry>;
  /** Last known state of each object, it is the "before" of its next modification */
  private readonly snapshots = new WeakMap<fabric.FabricObject, string>();
  /** The objects added since the last mouse up, whose final state is not known yet */
  private readonly pending = new Set<fabric.FabricObject>();
  /** The state the objects pressed had when they were, which is the "before" of the modification the press makes */
  private readonly pressed = new Map<fabric.FabricObject, string>();
  private applying = false;

  /**
   * @param canvas the canvas to undo/redo on
   * @param undoSteps number of steps to maintain
   */
  constructor(canvas: fabric.Canvas, undoSteps: number) {
    this.canvas = canvas;
    this.entries = new UndoHistory<HistoryEntry>(undoSteps);
  }

  /**
   * True while undo or redo add or remove an object. The additions made then
   * are not new actions, so they are neither recorded nor announced.
   */
  get replaying(): boolean {
    return this.applying;
  }

  /**
   * Record an object added to the canvas
   */
  onObjectAdded(object: fabric.FabricObject): void {
    this.snapshots.set(object, stateOf(object));
    this.pending.add(object);
    this.entries.keep({ action: "add", object });
  }

  /**
   * Forget the objects which were added, and which are taken off the canvas
   * before the drawing of them was finished. They were the last actions.
   */
  discard(objects: fabric.FabricObject[]): void {
    for (
      let last = this.entries.getCurrent();
      last?.action === "add" && objects.includes(last.object);
      last = this.entries.getCurrent()
    ) {
      this.entries.pop();
    }
    objects.forEach((object) => this.pending.delete(object));
  }

  /**
   * The state of what is pressed, before the press changes it. A modification goes back
   * to it, whatever the objects were before the press: the snapshots are the state they
   * had when they were added, which is not the one of an object which something else
   * changed since.
   */
  onMouseDown(target: fabric.FabricObject): void {
    this.pressed.clear();
    objectsOf(target).forEach((object) =>
      this.pressed.set(object, stateOutsideGroup(object))
    );
  }

  /**
   * Record a modification on the canvas: of an object, or of the objects of a selection
   * (one action for all of them). The objects which the history does not know, as they
   * were not added through {@link onObjectAdded}, are ignored, and so is a modification
   * which changed nothing.
   */
  onObjectModified(target: fabric.FabricObject): void {
    const changes: Change[] = [];
    objectsOf(target).forEach((object) => {
      const before = this.pressed.get(object) ?? this.snapshots.get(object);
      if (before === undefined) return;
      const after = stateOutsideGroup(object);
      this.snapshots.set(object, after);
      if (after !== before) changes.push({ object, before, after });
    });
    this.pressed.clear();
    if (changes.length) this.entries.keep({ action: "modify", changes });
  }

  /**
   * Record one stroke of the eraser, which is one action whatever the number
   * of objects it erased
   */
  onErased(erasures: Erasure[]): void {
    this.entries.keep({ action: "erase", erasures });
  }

  /**
   * An object is added while the mouse is down (it is resized by the move of
   * the mouse), so its state is only final on mouse up.
   */
  onMouseUp(): void {
    this.pending.forEach((object) => this.snapshots.set(object, stateOf(object)));
    this.pending.clear();
  }

  /**
   * Record the removal of the objects and remove them from the canvas
   */
  remove(objects: fabric.FabricObject[]): void {
    objects.forEach((object) => {
      this.entries.keep({ action: "remove", object });
      this.canvas.remove(object);
    });
  }

  /**
   * Undo the last action
   *
   * @returns false when there was nothing to undo
   */
  undo(): boolean {
    const entry = this.entries.getCurrent();
    if (!entry) return false;
    this.entries.undo();
    this.apply(entry, false);
    return true;
  }

  /**
   * Redo the last undone action
   *
   * @returns false when there was nothing to redo
   */
  redo(): boolean {
    const entry = this.entries.redo();
    if (!entry) return false;
    this.apply(entry, true);
    return true;
  }

  canUndo(): boolean {
    return this.entries.canUndo();
  }

  canRedo(): boolean {
    return this.entries.canRedo();
  }

  /**
   * Forget everything recorded so far
   */
  clear(): void {
    this.entries.clear();
    this.pending.clear();
    this.pressed.clear();
  }

  /**
   * Take the stroke off the erasing group of the object, or put it back. A group
   * which the stroke created goes away with it, the object is as it was.
   */
  private applyErasure(
    { object, group, source, created }: Erasure,
    forward: boolean
  ): void {
    if (forward) {
      if (created) object.clipPath = group;
      else group.add(source);
    } else if (created) {
      object.clipPath = undefined;
    } else {
      group.remove(source);
    }
    group.set("dirty", true);
    object.set("dirty", true);
  }

  /**
   * Set the objects of a modification to their state before it (undo) or after it
   * (redo): the properties it changed, and no others
   */
  private applyChanges(changes: Change[], forward: boolean): void {
    // The objects of a selection have a place relative to it: they are given the ones of the canvas
    const active = this.canvas.getActiveObject();
    if (
      active instanceof fabric.ActiveSelection &&
      changes.some(({ object }) => active.contains(object))
    ) {
      this.canvas.discardActiveObject();
    }
    changes.forEach(({ object, before, after }) => {
      const [state, other] = forward ? [after, before] : [before, after];
      object.set(changedProps(state, other));
      object.setCoords();
      this.snapshots.set(object, state);
    });
    this.pressed.clear();
  }

  private apply(entry: HistoryEntry, forward: boolean): void {
    this.applying = true;
    try {
      switch (entry.action) {
        case "erase":
          entry.erasures.forEach((erasure) => this.applyErasure(erasure, forward));
          break;
        case "modify":
          this.applyChanges(entry.changes, forward);
          break;
        case "add":
        case "remove":
          // redo of an add, and undo of a remove, put the object back
          if ((entry.action === "add") === forward) {
            this.canvas.add(entry.object);
          } else {
            this.canvas.remove(entry.object);
          }
          break;
      }
      this.canvas.renderAll();
    } finally {
      this.applying = false;
    }
  }
}
