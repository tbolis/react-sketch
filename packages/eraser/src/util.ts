import { FabricObject, Path, TMat2D, util } from "fabric";

/**
 * Utility to apply a clip path to an object, merging with its existing clip path.
 * @param {FabricObject} object The eraser path in canvas coordinate plane
 * @param {FabricObject} clipPath The clipPath to apply to the path
 * @param {TMat2D} t The transform matrix of the object that the clip path belongs to
 * @returns {Path} path with clip path
 */
export function clipObject(object: FabricObject, clipPath: FabricObject, t: TMat2D) {
  //  when passing down a clip path it becomes relative to the parent
  //  so we transform it accordingly and set `absolutePositioned` to false
  clipPath.absolutePositioned = false;
  util.applyTransformToObject(
    clipPath,
    util.multiplyTransformMatrixArray([
      util.calcPlaneChangeMatrix(
        clipPath.absolutePositioned ? undefined : t,
        object.calcTransformMatrix()
      ),
      clipPath.calcTransformMatrix(),
    ])
  );

  //  We need to clip `path` with both `clipPath` and it's own clip path if existing (`path.clipPath`)
  //  so in turn `path` erases an object only where it overlaps with all it's clip paths, regardless of how many there are.
  //  this is done because both clip paths may have nested clip paths of their own (this method walks down a collection => this may reccur),
  //  so we can't assign one to the other's clip path property.
  return (object.clipPath = object.clipPath
    ? util.mergeClipPaths(clipPath, object.clipPath as FabricObject)
    : clipPath);
}

/**
 * Utility to apply a clip path to a path.
 * Used to preserve clipping on eraser paths in nested objects.
 * Called when a group has a clip path that should be applied to the path before applying erasing on the group's objects.
 * @param {Path} path The eraser path
 * @param {FabricObject} object The clipPath to apply to path belongs to object
 * @returns {Promise<Path>}
 */
export function cloneAndClip(
  path: Path,
  object: FabricObject & Required<Pick<FabricObject, "clipPath">>
) {
  const t = object.calcTransformMatrix();
  return Promise.all([
    path.clone(),
    object.clipPath.clone(["absolutePositioned", "inverted"]),
  ]).then(([clonedPath, clonedClipPath]) =>
    clipObject(clonedPath, clonedClipPath as FabricObject, t)
  );
}
