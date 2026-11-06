import { Path, classRegistry } from "fabric";

/**
 * The fill of an area: a path of the color, which is under the objects
 * around the area, and over the ones it is in. It is a class of its own, so
 * that a fill is known among the objects (it is saved with its type, and
 * loaded as one).
 */
export class FillPath extends Path {
  static type = "BucketFill";
}

classRegistry.setClass(FillPath);
