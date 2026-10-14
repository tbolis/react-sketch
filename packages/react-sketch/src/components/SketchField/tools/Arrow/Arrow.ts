import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

export class Arrow extends FabricCanvasTool {
  private width: number;
  private color?: string;
  private isDown: boolean;
  private startX: number;
  private startY: number;
  private line: fabric.Line | null;
  private head: fabric.Triangle | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.width = 1;
    this.isDown = false;
    this.startX = 0;
    this.startY = 0;
    this.line = null;
    this.head = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      strokeWidth: this.width,
      fill: this.color,
      stroke: this.color,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    this.head = new fabric.Triangle({
      fill: this.color,
      left: pointer.x,
      top: pointer.y,
      originX: "center",
      originY: "center",
      height: 3 * this.width,
      width: 3 * this.width,
      selectable: false,
      evented: false,
      angle: 90,
    });
    this.canvas.add(this.line);
    this.canvas.add(this.head);
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.isDown) return;
    const pointer = this.pointer(event);
    this.line?.set({ x2: pointer.x, y2: pointer.y });
    this.line?.setCoords();
    this.head?.set({
      left: pointer.x,
      top: pointer.y,
      angle:
        90 +
        (Math.atan2(pointer.y - this.startY, pointer.x - this.startX) * 180) /
          Math.PI,
    });
    this.canvas.renderAll();
  }

  /**
   * The line and the head are merged into a single group once the arrow is
   * drawn (this also runs when the pointer left the canvas while drawing)
   */
  doMouseUp(): void {
    this.isDown = false;
    if (!this.line || !this.head) return;
    this.canvas.remove(this.line, this.head);
    // fabric 7 centers groups by default, the arrow keeps its top left origin
    this.canvas.add(
      new fabric.Group([this.line, this.head], {
        originX: "left",
        originY: "top",
      })
    );
    this.line = this.head = null;
  }

  doMouseOut(): void {
    this.isDown = false;
  }

  type(): Tool {
    return Tool.ARROW;
  }
}
