import * as fabric from "fabric";
import { LaserBrush } from "@react-sketch/laserpointer";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

/**
 * A pointer to show something on the sketch: the line follows the pointer,
 * fades out after a moment and disappears. It is drawn on the top canvas
 * only, so it is not an object of the sketch: nothing is added, it is not in
 * `toJSON()` or `toDataURL()`, and it is not an undo step.
 */
export class LaserPointer extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(props: SketchProperties): void {
    const brush = this.laserBrush;
    this.canvas.isDrawingMode = true;
    brush.width = props.lineWidth ? props.lineWidth : 1;
    brush.color = props.lineColor ? props.lineColor : "red";
    brush.shadow = new fabric.Shadow({
      color: brush.color,
      blur: Math.max(brush.width * 2, 8),
    });
  }

  type(): Tool {
    return Tool.LASER_POINTER;
  }

  /** The line is gone with the tool, it does not fade on while another tool is in use */
  dispose(): void {
    const current = this.canvas.freeDrawingBrush;
    if (!(current instanceof LaserBrush)) return;
    current.dispose();
    this.canvas.freeDrawingBrush = undefined;
  }

  /**
   * The laser brush of the canvas. It is created the first time it is needed,
   * and the canvas keeps it for the next line.
   */
  private get laserBrush(): LaserBrush {
    const current = this.canvas.freeDrawingBrush;
    if (current instanceof LaserBrush) return current;
    const brush = new LaserBrush(this.canvas);
    this.canvas.freeDrawingBrush = brush;
    return brush;
  }
}
