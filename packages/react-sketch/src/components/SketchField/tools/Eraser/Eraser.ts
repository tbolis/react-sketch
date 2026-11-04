import * as fabric from "fabric";
import { ClippingGroup, EraserBrush, type ErasingEvent } from "@react-sketch/eraser";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

/**
 * What one stroke of the eraser did to an object: `source` is the part of the
 * stroke that was added to `group`, the erasing group of the object.
 * `created` is true when the object had no erasing group before the stroke.
 */
export interface Erasure {
  object: fabric.FabricObject;
  group: ClippingGroup;
  source: fabric.FabricObject;
  created: boolean;
}

/** The largest cursor image the browsers show (Chrome and Firefox: 128 pixels) */
const MAX_CURSOR_SIZE = 128;

/**
 * The cursor of the eraser: a circle of the size of the brush, in black and
 * white so that it shows on any color. It falls back to the crosshair for a
 * brush the browser cannot show as a cursor.
 */
const brushCursor = (width: number): string => {
  const size = Math.ceil(width) + 4;
  if (size > MAX_CURSOR_SIZE) return "crosshair";
  const c = size / 2;
  const r = width / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${c}" cy="${c}" r="${r + 0.5}" fill="none" stroke="white" stroke-width="2"/>` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="black" stroke-width="1"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, crosshair`;
};

/**
 * Erases parts of the objects, not the background. The strokes are kept on the
 * objects as a clip path, so they are saved by `toJSON` and loaded by `fromJSON`.
 */
export class Eraser extends FabricCanvasTool {
  /** Called, after each stroke which erased something, with what it did */
  onErase?: (erasures: Erasure[]) => void;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(props: SketchProperties): void {
    const brush = this.eraserBrush;
    this.canvas.isDrawingMode = true;
    brush.width = props.lineWidth ? props.lineWidth : 1;
    this.canvas.freeDrawingCursor = brushCursor(brush.width);
  }

  type(): Tool {
    return Tool.ERASER;
  }

  /**
   * The eraser brush of the canvas. It is created the first time it is needed,
   * and the canvas keeps it for the next stroke.
   */
  private get eraserBrush(): EraserBrush {
    const current = this.canvas.freeDrawingBrush;
    if (current instanceof EraserBrush) return current;
    const brush = new EraserBrush(this.canvas);
    // The stroke is committed here, and not by the brush, to know what it changed
    brush.on("end", (event: ErasingEvent<"end">) => {
      event.preventDefault();
      void this.commit(brush, event.detail);
    });
    this.canvas.freeDrawingBrush = brush;
    return brush;
  }

  private async commit(
    brush: EraserBrush,
    stroke: { path: fabric.Path; targets: fabric.FabricObject[] }
  ): Promise<void> {
    // An object with a clip path of its own gets it wrapped in the erasing group
    // by the first stroke, and undo takes only the stroke off that group, so the
    // clip path is not lost
    const created = new Map(stroke.targets.map((o) => [o, !o.clipPath]));
    const sources = await brush.commit(stroke);
    const erasures: Erasure[] = [];
    sources.forEach((source, object) => {
      // The background and the overlay image are not erased, they are not erasable
      const group = object.clipPath;
      if (group instanceof ClippingGroup && created.has(object)) {
        erasures.push({
          object,
          group,
          source,
          created: created.get(object) as boolean,
        });
      }
    });
    if (erasures.length) this.onErase?.(erasures);
  }
}
