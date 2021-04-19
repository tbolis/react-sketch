import { fabric } from "fabric";

export class Pencil {
  private canvas: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  configureCanvas(config: any): void {
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.width = 3;
    this.canvas.freeDrawingBrush.color = "black";
  }
}
