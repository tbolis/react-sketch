import { fabric } from "fabric";
import { FabricCanvasTool } from "../index";
import { SketchProperties } from "../../../../types";

export class Line extends FabricCanvasTool {
  private width?: number;
  private color?: string;
  private isDown: boolean;
  private line: fabric.Line | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.line = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.canvas.isDrawingMode = this.canvas.selection = false;
    this.canvas.forEachObject((o) => (o.selectable = o.evented = false));
    this.width = props.lineWidth;
    this.color = props.lineColor;
  }

  doMouseDown(event: fabric.IEvent): void {
    this.isDown = true;
    const pointer = this.canvas.getPointer(event.e);
    const points = [pointer.x, pointer.y, pointer.x, pointer.y];
    this.line = new fabric.Line(points, {
      strokeWidth: this.width,
      fill: this.color,
      stroke: this.color,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    this.canvas.add(this.line);
  }

  doMouseMove(event: fabric.IEvent): void {
    if (!this.isDown) return;
    const pointer = this.canvas.getPointer(event.e);
    this.line?.set({ x2: pointer.x, y2: pointer.y });
    this.line?.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(event: fabric.IEvent): void {
    this.isDown = false;
  }

  doMouseOut(event: fabric.IEvent): void {
    this.isDown = false;
  }
}
