import * as fabric from "fabric";

/**
 * A group which the user made from a selection. It is a class of its own, so that
 * it is known among the objects: the group of an arrow is a plain group, and is not
 * taken apart. It is saved with its type, and loaded as one.
 */
export class SketchGroup extends fabric.Group {
  static type = "SketchGroup";
}

fabric.classRegistry.setClass(SketchGroup);
