import * as fabric from "fabric";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";
import { colorNameToHex, hexToRgbA } from "../../../../utils";

export class Highlighter extends FabricCanvasTool {
  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  /**
   * @throws Error when lineColor is neither a hex code nor a known color name
   */
  configureCanvas(props: SketchProperties): void {
    const color = props.lineColor ? props.lineColor : "black";
    this.canvas.isDrawingMode = true;
    this.brush.width = props.lineWidth ? props.lineWidth : 1;
    this.brush.color = hexToRgbA(
      color.startsWith("#") ? color : colorNameToHex(color) ?? color
    );
  }

  type(): Tool {
    return Tool.HIGHLIGHTER;
  }
}
