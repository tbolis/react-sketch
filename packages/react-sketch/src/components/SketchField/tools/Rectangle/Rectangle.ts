import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

export class Rectangle extends FabricCanvasTool {
  private width?: number;
  private color?: string;
  private fill?: string;
  private isDown: boolean;
  private startX: number;
  private startY: number;
  private rect: fabric.Rect | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.startX = 0;
    this.startY = 0;
    this.rect = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
    this.fill = props.fillColor ? props.fillColor : "transparent";
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.rect = new fabric.Rect({
      left: this.startX,
      top: this.startY,
      originX: "left",
      originY: "top",
      width: 0,
      height: 0,
      stroke: this.color,
      strokeWidth: this.width,
      fill: this.fill,
      transparentCorners: false,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
      angle: 0,
    });
    this.canvas.add(this.rect);
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.isDown) return;
    const pointer = this.pointer(event);
    this.rect?.set({
      left: Math.min(this.startX, pointer.x),
      top: Math.min(this.startY, pointer.y),
      width: Math.abs(this.startX - pointer.x),
      height: Math.abs(this.startY - pointer.y),
    });
    this.rect?.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(): void {
    this.isDown = false;
  }

  type(): Tool {
    return Tool.RECTANGLE;
  }
}
