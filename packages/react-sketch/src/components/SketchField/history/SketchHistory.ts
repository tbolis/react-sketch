import { fabric } from "fabric";
import { UndoHistory } from "./index";

/**
 * One undoable action of the sketch
 */
type HistoryEntry =
  | { action: "add"; object: fabric.Object }
  | { action: "remove"; object: fabric.Object }
  | { action: "modify"; object: fabric.Object; before: string; after: string };

/** State of an object, as JSON string */
const stateOf = (object: fabric.Object): string => JSON.stringify(object.toJSON());

/**
 * Records what happens to the objects of a canvas (added, modified, removed)
 * and applies undo and redo on them.
 */
export class SketchHistory {
  private readonly canvas: fabric.Canvas;
  private readonly entries: UndoHistory<HistoryEntry>;
  /** Last known state of each object, it is the "before" of its next modification */
  private readonly snapshots = new WeakMap<fabric.Object, string>();
  /** The object added since the last mouse up, whose final state is not known yet */
  private pending: fabric.Object | null = null;
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
  onObjectAdded(object: fabric.Object): void {
    this.snapshots.set(object, stateOf(object));
    this.pending = object;
    this.entries.keep({ action: "add", object });
  }

  /**
   * Record an object modified on the canvas. Objects which were not added
   * through {@link onObjectAdded} (for example a multiple selection) are ignored.
   */
  onObjectModified(object: fabric.Object): void {
    const before = this.snapshots.get(object);
    if (before === undefined) return;
    const after = stateOf(object);
    this.snapshots.set(object, after);
    this.entries.keep({ action: "modify", object, before, after });
  }

  /**
   * An object is added while the mouse is down (it is resized by the move of
   * the mouse), so its state is only final on mouse up.
   */
  onMouseUp(): void {
    if (this.pending) {
      this.snapshots.set(this.pending, stateOf(this.pending));
      this.pending = null;
    }
  }

  /**
   * Record the removal of the objects and remove them from the canvas
   */
  remove(objects: fabric.Object[]): void {
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
    this.pending = null;
  }

  private apply(entry: HistoryEntry, forward: boolean): void {
    const { object } = entry;
    this.applying = true;
    try {
      switch (entry.action) {
        case "add":
        case "remove":
          // redo of an add, and undo of a remove, put the object back
          if ((entry.action === "add") === forward) {
            this.canvas.add(object);
          } else {
            this.canvas.remove(object);
          }
          break;
        case "modify": {
          const state = forward ? entry.after : entry.before;
          object.setOptions(JSON.parse(state));
          object.setCoords();
          this.snapshots.set(object, state);
          break;
        }
      }
      this.canvas.renderAll();
    } finally {
      this.applying = false;
    }
  }
}
