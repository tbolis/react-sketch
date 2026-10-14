import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { Tool } from "../../../../types";

export class Pan extends FabricCanvasTool {
  private isDown: boolean;
  private startX: number;
  private startY: number;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.startX = 0;
    this.startY = 0;
  }

  configureCanvas(): void {
    this.setInteractive(false);
    // Change the cursor to the move grabber
    this.canvas.defaultCursor = "move";
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.isDown) return;
    const pointer = this.pointer(event);
    this.canvas.relativePan(
      new fabric.Point(pointer.x - this.startX, pointer.y - this.startY)
    );
    this.canvas.renderAll();
  }

  doMouseUp(): void {
    this.isDown = false;
  }

  type(): Tool {
    return Tool.PAN;
  }
}
