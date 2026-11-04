import "fabric";

declare module "fabric" {
  interface FabricObjectProps {
    /**
     * Indicates whether this object can be erased by the {@link EraserBrush}\
     * The `deep` option introduces fine grained control over a {@link Group#erasable} property.\
     * When set to `true` the eraser will erase the entire object.\
     * When set to `deep` the eraser will erase nested objects if they are erasable,
     * leaving the group and the other objects untouched.\
     * When set to `false` the object and its descendants are untouched.\
     *
     * When using `true` on a group Consider using {@link applyEraser} on layout changes
     * in order to propagate the eraser to descendants so that new descendants won't be affected by it.
     */
    erasable: boolean | "deep";
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FabricObject extends FabricObjectProps {}
}

export {};
