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

/** The size of the preview, as a fraction of the canvas */
export const PREVIEW_MULTIPLIER = 0.25;

/**
 * Draw the preview again: a small copy of the whole drawing, whatever the view of the
 * canvas shows. A canvas with an image of another site which does not allow it (CORS)
 * cannot be exported, so there is no preview then.
 */
export const syncPreview = (): void =>
  queueMicrotask(() =>
    withSketch((sketch) => {
      try {
        CONFIG.preview = sketch.toDataURL({ multiplier: PREVIEW_MULTIPLIER });
      } catch {
        CONFIG.preview = "";
      }
    })
  );

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

/**
 * What the changes of the drawing update: the state of the actions, and the preview
 */
export const syncChange = (): void => {
  syncState();
  syncPreview();
};
