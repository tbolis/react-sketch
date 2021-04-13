import { fabric } from "fabric";
import { SketchProperties } from "../../SketchField";

export class Pencil {
  private canvas: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  configureCanvas(config: SketchProperties): void {
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.width = 3;
    this.canvas.freeDrawingBrush.color = "black";
  }
}
