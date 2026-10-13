import { createRef } from "react";
import { CONFIG } from "../../stores/config";

/**
 * TODO(part2): minimal stub of the ref API of SketchField. These methods are not part of
 * the published types yet. Remove this interface and type `sketchRef` with the
 * instance type exported by react-sketch once the component API is merged.
 */
export interface SketchApi {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  zoom(factor: number): void;
  addImg(
    dataUrl: string,
    options?: { left?: number; top?: number; scale?: number }
  ): void;
  addText(text: string, options?: object): void;
  toDataURL(options?: {
    format?: string;
    quality?: number;
    multiplier?: number;
  }): string;
  toJSON(propertiesToInclude?: ArrayLike<string>): object;
  clear(propertiesToInclude?: ArrayLike<string>): string;
  removeSelected(): void;
  copy(): void;
  paste(): void;
  setBackgroundFromDataUrl(
    dataUrl: string,
    options?: {
      stretched?: boolean;
      stretchedX?: boolean;
      stretchedY?: boolean;
      originX?: string;
      originY?: string;
    }
  ): void;
}

/**
 * Holds the mounted SketchField, shared by the canvas and the panels that act on it.
 */
export const sketchRef = createRef<SketchApi>();

/**
 * Run an action on the mounted canvas, does nothing when there is none.
 */
export const withSketch = (action: (sketch: SketchApi) => void): void => {
  if (sketchRef.current) {
    action(sketchRef.current);
  }
};

/**
 * Copy the undo/redo availability of the canvas into the store
 */
export const syncHistory = (sketch: SketchApi): void => {
  CONFIG.canUndo = sketch.canUndo();
  CONFIG.canRedo = sketch.canRedo();
};
