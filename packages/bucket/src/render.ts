import * as fabric from "fabric";
import { FillPath } from "./FillPath";
import type { Pixels } from "./flood";

interface Rendering {
  /** Which objects are drawn */
  include: (object: fabric.FabricObject) => boolean;
  /** Whether the overlay image is drawn. Defaults to true */
  overlay?: boolean;
  /** The part of the canvas, in canvas pixels. Defaults to all of it */
  area?: { left: number; top: number; width: number; height: number };
}

/**
 * The pixels of the objects of the canvas, as they are seen: with the zoom and
 * the position of the view, one pixel for each pixel of the canvas (not of the
 * screen). The background (the color and the image) is not drawn, so an area is
 * closed by what is drawn on the canvas only, whatever is behind it.
 *
 * It throws when the canvas is tainted, as it is by an image of a server without
 * CORS headers.
 */
export const renderPixels = (
  canvas: fabric.StaticCanvas,
  { include, overlay = true, area }: Rendering
): Pixels => {
  const { backgroundColor, backgroundImage, overlayColor, overlayImage } = canvas;
  canvas.backgroundColor = "";
  canvas.backgroundImage = undefined;
  canvas.overlayColor = "";
  if (!overlay) canvas.overlayImage = undefined;
  let element: HTMLCanvasElement;
  try {
    element = canvas.toCanvasElement(1, {
      ...area,
      filter: (object) => include(object as fabric.FabricObject),
    });
  } finally {
    canvas.backgroundColor = backgroundColor;
    canvas.backgroundImage = backgroundImage;
    canvas.overlayColor = overlayColor;
    canvas.overlayImage = overlayImage;
  }
  const { width, height } = element;
  const context = element.getContext("2d") as CanvasRenderingContext2D;
  const { data } = context.getImageData(0, 0, width, height);
  return { data, width, height };
};

/** Whether the object is a fill, which does not close an area */
export const isFill = (object: fabric.FabricObject): boolean =>
  object instanceof FillPath;

/**
 * The index of the topmost object which paints the pixel (in canvas pixels), or
 * -1 when there is none
 */
export const paintedBy = (
  canvas: fabric.StaticCanvas,
  x: number,
  y: number
): number => {
  const objects = canvas.getObjects();
  const view = fabric.util.invertTransform(canvas.viewportTransform);
  const point = new fabric.Point(x + 0.5, y + 0.5).transform(view);
  for (let i = objects.length - 1; i >= 0; i--) {
    const object = objects[i];
    if (!object.visible) continue;
    // The bounds of the object, with a margin for the edge of its line
    const { left, top, width, height } = object.getBoundingRect();
    const margin = 2;
    if (
      point.x < left - margin ||
      point.y < top - margin ||
      point.x > left + width + margin ||
      point.y > top + height + margin
    ) {
      continue;
    }
    try {
      const { data } = renderPixels(canvas, {
        include: (other) => other === object,
        overlay: false,
        area: { left: x, top: y, width: 1, height: 1 },
      });
      if (data[3] > 0) return i;
    } catch {
      // Its pixels cannot be read (a tainted canvas), and it is where it is
      return i;
    }
  }
  return -1;
};
