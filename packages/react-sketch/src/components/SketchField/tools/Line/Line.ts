import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { LineStyle, SketchProperties, Tool } from "../../../../types";
import { lineStroke } from "../../../../utils";

export class Line extends FabricCanvasTool {
  private width?: number;
  private color?: string;
  private style?: LineStyle;
  private isDown: boolean;
  private line: fabric.Line | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.line = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
    this.style = props.lineStyle;
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    const points: [number, number, number, number] = [
      pointer.x,
      pointer.y,
      pointer.x,
      pointer.y,
    ];
    this.line = new fabric.Line(points, {
      strokeWidth: this.width,
      fill: this.color,
      stroke: this.color,
      ...lineStroke(this.style, this.width ?? 1),
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    this.canvas.add(this.line);
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.isDown) return;
    const pointer = this.pointer(event);
    this.line?.set({ x2: pointer.x, y2: pointer.y });
    this.line?.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(): void {
    this.isDown = false;
  }

  doMouseOut(): void {
    this.isDown = false;
  }

  type(): Tool {
    return Tool.LINE;
  }
}
