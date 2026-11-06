import * as fabric from "fabric";
import { FillPath } from "./FillPath";
import { DEFAULT_TOLERANCE, floodFill, grow, type Pixels } from "./flood";
import { outlinePath } from "./outline";
import { isFill, paintedBy, renderPixels } from "./render";

export interface BucketFillOptions {
  /** The color of the fill, any color the canvas knows. Nothing is filled with a transparent one */
  color: string;
  /**
   * How different a pixel can be from the one pressed, from 0 to 255, and still
   * be of the area. The pixels of the edge of a line are neither the color of the
   * line nor the one of the area, so some tolerance lets the area go up to them.
   * Defaults to 32
   */
  tolerance?: number;
  /**
   * How many pixels the fill goes under the lines around it, so that the edge of
   * a line has no seam. Defaults to 1
   */
  overlap?: number;
  /**
   * How far (in pixels) the outline of the fill can be from the pixels it is
   * taken from, to make the steps of a diagonal or of a curve a line. Defaults to 0.5
   */
  simplify?: number;
}

export interface BucketFillResult {
  /** The fill, which is not on the canvas yet */
  fill: FillPath;
  /**
   * Where the fill goes among the objects of the canvas (`canvas.insertAt`):
   * over the object the area is in, and under the ones around it
   */
  index: number;
}

/**
 * The fill of the area of the canvas which is closed around a point.
 *
 * The area is the one of the pixels with the color of the pixel at the point,
 * which are connected to it, in what the canvas shows of its objects (without
 * its background). What closes it can be any object: a line, a rectangle, a
 * circle, a polygon, a stroke of the pencil, or the overlay image. The
 * background is not looked at, so a background image does not make an area.
 *
 * The area has to be closed within the canvas, as seen with the zoom and the
 * position of the view. When it reaches the edge, which is what an area does
 * where nothing closes it, there is no fill.
 *
 * The fill is an object the same as the others: it is added by the caller, it
 * can be saved and loaded, scaled with the canvas and removed. It goes over the
 * object the area is in, and under the ones which close it.
 *
 * @param canvas the canvas to fill on
 * @param point the pixel pressed, in canvas pixels (`canvas.getViewportPoint(event)`)
 * @returns the fill, or null when there is nothing to fill: the point is out of
 * the canvas, the area is not closed, or the color is transparent
 */
export const bucketFill = (
  canvas: fabric.StaticCanvas,
  point: { x: number; y: number },
  options: BucketFillOptions
): BucketFillResult | null => {
  const {
    color,
    tolerance = DEFAULT_TOLERANCE,
    overlap = 1,
    simplify = 0.5,
  } = options;
  if (new fabric.Color(color).getAlpha() === 0) return null;
  const x = Math.floor(point.x);
  const y = Math.floor(point.y);
  if (!(x >= 0 && y >= 0 && x < canvas.getWidth() && y < canvas.getHeight())) {
    return null;
  }

  // The fills do not close an area, they are what it is filled with
  const layers = (include: (object: fabric.FabricObject) => boolean): Pixels => {
    try {
      return renderPixels(canvas, { include });
    } catch {
      // An image of a server without CORS headers taints the canvas, so its
      // pixels cannot be read. The area is closed by the other objects then.
      return renderPixels(canvas, {
        include: (object) =>
          include(object) && !(object instanceof fabric.FabricImage),
        overlay: false,
      });
    }
  };
  const drawn = layers((object) => !isFill(object));
  const region = floodFill(drawn, x, y, tolerance);
  if (!region || region.open) return null;

  // Over what the area is in (the older fills too), under what is on top of it
  const index = paintedBy(canvas, x, y) + 1;
  const above = new Set(canvas.getObjects().slice(index));
  const cover = index
    ? layers((object) => !isFill(object) && above.has(object))
    : drawn;
  const grown = grow(region, cover, overlap);

  const view = fabric.util.invertTransform(canvas.viewportTransform);
  const data = outlinePath(grown, simplify, ({ x: px, y: py }) =>
    new fabric.Point(px, py).transform(view)
  );
  if (!data) return null;

  const fill = new FillPath(data, {
    fill: color,
    stroke: null,
    strokeWidth: 0,
    fillRule: "evenodd",
  });
  return { fill, index };
};
