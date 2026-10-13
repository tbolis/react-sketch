import { fabric } from "fabric";
import { FabricCanvasTool } from "../index";
import { Tool } from "../../../../types";

export class Select extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(): void {
    this.setInteractive(true);
  }

  type(): Tool {
    return Tool.SELECT;
  }
}
