import { createRef } from "react";
import type { SketchField } from "react-sketch";
import { CONFIG } from "../../stores/config";

/**
 * Holds the mounted SketchField, shared by the canvas and the panels that act on it.
 * It is set between the mount and the unmount of the component, which is when its
 * methods can be used.
 */
export const sketchRef = createRef<SketchField>();

/**
 * Run an action on the mounted canvas, does nothing when there is none.
 */
export const withSketch = (action: (sketch: SketchField) => void): void => {
  if (sketchRef.current) {
    action(sketchRef.current);
  }
};

/**
 * Copy the state of the canvas which enables or disables the actions (undo, redo,
 * copy, delete) into the store. The canvas does not announce all of its changes, so
 * this is called by its callbacks and after the actions which change it.
 *
 * It reads the canvas a moment later: some callbacks run before the canvas is done,
 * for example a pasted object is selected right after it is added.
 */
export const syncState = (): void =>
  queueMicrotask(() =>
    withSketch((sketch) => {
      CONFIG.canUndo = sketch.canUndo();
      CONFIG.canRedo = sketch.canRedo();
      CONFIG.hasSelection = sketch.hasSelection();
    })
  );
