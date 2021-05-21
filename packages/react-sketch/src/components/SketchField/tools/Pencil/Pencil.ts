import { fabric } from "fabric";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

export class Pencil extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(config: SketchProperties): void {
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.width = config.lineWidth ? config.lineWidth : 1;
    this.canvas.freeDrawingBrush.color = config.lineColor
      ? config.lineColor
      : "black";
  }

  type(): Tool {
    return Tool.PENCIL;
  }
}
