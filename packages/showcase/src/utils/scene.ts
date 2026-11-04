import type { Size } from "../stores/config";

/** The part of a canvas object which says where it is */
interface PlacedObject {
  originX?: string;
  originY?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  [property: string]: unknown;
}

interface Scene {
  objects?: PlacedObject[];
  [property: string]: unknown;
}

/** The start and the end of an object on one axis */
const extent = (
  position = 0,
  length = 0,
  scale = 1,
  origin?: string
): [number, number] => {
  const size = length * scale;
  if (origin === "center") return [position - size / 2, position + size / 2];
  if (origin === "right" || origin === "bottom") return [position - size, position];
  return [position, position + size];
};

/** The properties which say where an object is, on each axis. The lines carry their end points too */
const HORIZONTAL = ["left", "x1", "x2"];
const VERTICAL = ["top", "y1", "y2"];

const moveObject = (object: PlacedObject, dx: number, dy: number): PlacedObject => {
  const moved = { ...object };
  for (const [keys, by] of [
    [HORIZONTAL, dx],
    [VERTICAL, dy],
  ] as const) {
    for (const key of keys) {
      const value = moved[key];
      if (typeof value === "number") moved[key] = value + by;
    }
  }
  return moved;
};

/**
 * Moves the objects of a scene so that they are in the middle of a canvas of the
 * given size. The sample scenes were drawn for a small canvas, and the canvas of the
 * showcase fills the window, with the panels floating over its edges.
 *
 * The objects are not scaled nor rotated, and a scene with no objects is returned
 * as it is.
 */
export const centerScene = <T extends Scene>(scene: T, size: Size): T => {
  const { objects } = scene;
  if (!objects || objects.length === 0) return scene;

  const xs = objects.map((o) => extent(o.left, o.width, o.scaleX, o.originX));
  const ys = objects.map((o) => extent(o.top, o.height, o.scaleY, o.originY));
  const minX = Math.min(...xs.map(([start]) => start));
  const maxX = Math.max(...xs.map(([, end]) => end));
  const minY = Math.min(...ys.map(([start]) => start));
  const maxY = Math.max(...ys.map(([, end]) => end));
  const dx = Math.max(0, (size.width - (maxX - minX)) / 2) - minX;
  const dy = Math.max(0, (size.height - (maxY - minY)) / 2) - minY;

  return { ...scene, objects: objects.map((object) => moveObject(object, dx, dy)) };
};
