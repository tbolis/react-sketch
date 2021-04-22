import { fabric } from "fabric";
import { FabricCanvasTool } from "../index";
import { SketchProperties } from "../../../../types";

export class Pencil extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(config: SketchProperties): void {
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.width = 3;
    this.canvas.freeDrawingBrush.color = "black";
  }
}
