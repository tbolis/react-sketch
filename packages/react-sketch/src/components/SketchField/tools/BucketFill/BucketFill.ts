import * as fabric from "fabric";
import { bucketFill } from "@react-sketch/bucket";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

/** Whether the color is one which paints nothing */
const isTransparent = (color?: string): boolean =>
  !color || new fabric.Color(color).getAlpha() === 0;

/**
 * The color to fill with: the fill color, and the line color while the fill
 * color is transparent (its default), as there is nothing to fill with then
 */
const fillWith = ({ fillColor, lineColor }: SketchProperties): string => {
  if (!isTransparent(fillColor)) return fillColor as string;
  return isTransparent(lineColor) ? "black" : (lineColor as string);
};

/**
 * The cursor of the bucket: a bucket with a drop of the color it fills with,
 * outlined in black and white so that it shows on any color. The hot spot is
 * the drop, where the bucket pours.
 */
const bucketCursor = (color: string): string => {
  const parsed = new fabric.Color(color);
  const body = `<path d="M9 12H23L21 25H11Z"/>`;
  const handle = `<path d="M9 12C9 4 23 4 23 12" fill="none"/>`;
  const bucket = `<g transform="rotate(-25 16 16)">${body}${handle}</g>`;
  const dropPath =
    "M5 22C5 22 1.5 26.5 1.5 28.5A3.5 3.5 0 0 0 8.5 28.5C8.5 26.5 5 22 5 22Z";
  const drop = (attributes: string) => `<path d="${dropPath}" ${attributes}/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" stroke-linejoin="round">` +
    // The white outline, under the black one
    `<g fill="white" stroke="white" stroke-width="4">${bucket}${drop("")}</g>` +
    `<g fill="white" stroke="black" stroke-width="1.5">${bucket}</g>` +
    drop(
      `fill="#${parsed.toHex()}" fill-opacity="${parsed.getAlpha()}" stroke="black" stroke-width="1.2"`
    ) +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 5 27, crosshair`;
};

/**
 * Fills the area closed around the point of a click with the color: by lines,
 * rectangles, circles, polygons, strokes of the pencil, or the overlay image,
 * as long as the area is closed within the canvas. A click where the area is
 * not closed, or where there is nothing to fill, does nothing.
 *
 * The fill is an object of the sketch, a path under the objects which close it,
 * so it is one undo step, it is saved by `toJSON()`, and it scales with the canvas.
 */
export class BucketFill extends FabricCanvasTool {
  private color = "black";

  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.color = fillWith(props);
    this.canvas.defaultCursor = bucketCursor(this.color);
  }

  type(): Tool {
    return Tool.BUCKET_FILL;
  }

  doMouseDown(event: CanvasEvent): void {
    if (!event.e) return;
    const point = this.canvas.getViewportPoint(event.e);
    const filled = bucketFill(this.canvas, point, { color: this.color });
    if (!filled) return;
    this.canvas.insertAt(filled.index, filled.fill);
    this.canvas.requestRenderAll();
  }
}
