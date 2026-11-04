import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { LineStyle, SketchProperties, Tool } from "../../../../types";
import { linearDistance, lineStroke } from "../../../../utils";

export class Circle extends FabricCanvasTool {
  private width?: number;
  private color?: string;
  private style?: LineStyle;
  private fill?: string;
  private isDown: boolean;
  private startX: number;
  private startY: number;
  private circle: fabric.Circle | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.startX = 0;
    this.startY = 0;
    this.circle = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
    this.style = props.lineStyle;
    this.fill = props.fillColor ? props.fillColor : "transparent";
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.circle = new fabric.Circle({
      left: this.startX,
      top: this.startY,
      originX: "left",
      originY: "center",
      strokeWidth: this.width,
      stroke: this.color,
      ...lineStroke(this.style, this.width ?? 1),
      fill: this.fill,
      selectable: false,
      evented: false,
      radius: 1,
    });
    this.canvas.add(this.circle);
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.isDown) return;
    const pointer = this.pointer(event);
    // The circle is anchored at its left-center point and rotated towards the
    // pointer, so the drag segment is always the circle diameter
    this.circle?.set({
      radius: linearDistance({ x: this.startX, y: this.startY }, pointer) / 2,
      angle:
        (Math.atan2(pointer.y - this.startY, pointer.x - this.startX) * 180) /
        Math.PI,
    });
    this.circle?.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(): void {
    this.isDown = false;
  }

  cancel(): void {
    this.isDown = false;
  }

  type(): Tool {
    return Tool.CIRCLE;
  }
}
