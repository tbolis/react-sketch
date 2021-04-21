// @ts-nocheck

import { fabric } from "fabric";

class Line /*extends FabricCanvasTool*/ {
  private canvas: fabric.Canvas;
  private _width: number;
  private _color: string;
  private line: Line | null;
  private isDown: boolean;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this._width = 3;
    this._color = "blue";
    this.line = null;
    this.isDown = false;
  }

  configureCanvas(config) {
    this.canvas.isDrawingMode = this.canvas.selection = false;
    this.canvas.forEachObject((o) => (o.selectable = o.evented = false));
    this._width = 1;
    this._color = "blue";
  }

  doMouseDown(o) {
    this.isDown = true;
    const pointer = this.canvas.getPointer(o.e);
    const points = [pointer.x, pointer.y, pointer.x, pointer.y];
    this.line = new fabric.Line(points, {
      strokeWidth: this._width,
      fill: this._color,
      stroke: this._color,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    this.canvas.add(this.line);
  }

  doMouseMove(o) {
    if (!this.isDown) return;
    const pointer = this.canvas.getPointer(o.e);
    this.line.set({ x2: pointer.x, y2: pointer.y });
    this.line.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(o) {
    this.isDown = false;
  }

  doMouseOut(o) {
    this.isDown = false;
  }
}

export default Line;
