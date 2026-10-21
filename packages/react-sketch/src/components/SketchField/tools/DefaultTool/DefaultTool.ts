import * as fabric from "fabric";
import { FabricCanvasTool } from "../index";
import { Tool } from "../../../../types";

export class DefaultTool extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(): void {
    this.setInteractive(false);
    this.canvas.discardActiveObject();
    this.canvas.defaultCursor = "pointer";
    this.canvas.renderAll();
  }

  type(): Tool {
    return Tool.DEFAULT_TOOL;
  }
}
