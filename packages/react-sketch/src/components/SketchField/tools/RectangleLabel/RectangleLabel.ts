import { fabric } from "fabric";
import { FabricCanvasTool } from "../index";
import { RectangleLabelObject } from "./RectangleLabelObject";
import { SketchProperties, Tool } from "../../../../types";

const MAX_FONT_SIZE = 12;

export class RectangleLabel extends FabricCanvasTool {
  private width?: number;
  private color?: string;
  private fill?: string;
  private isDown: boolean;
  private startX: number;
  private startY: number;
  private label: RectangleLabelObject | null;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    this.isDown = false;
    this.startX = 0;
    this.startY = 0;
    this.label = null;
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
    this.fill = props.fillColor ? props.fillColor : "transparent";
  }

  doMouseDown(event: fabric.IEvent): void {
    this.isDown = true;
    const pointer = this.pointer(event);
    this.startX = pointer.x;
    this.startY = pointer.y;
    const label = new RectangleLabelObject(
      this.canvas,
      "New drawing",
      {
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
      },
      {
        left: this.startX,
        top: this.startY - MAX_FONT_SIZE,
        originX: "left",
        originY: "top",
        width: 0,
        fontSize: MAX_FONT_SIZE,
        noScaleCache: false,
        backgroundColor: this.color,
        transparentCorners: true,
        hasControls: false,
        angle: 0,
      }
    );
    this.label = label;

    // Shrink the text until it fits the third of the canvas height
    const { textbox } = label;
    const maxHeight = this.canvas.getHeight() / 3;
    while ((textbox.height ?? 0) > maxHeight) {
      const fontSize = textbox.fontSize ?? MAX_FONT_SIZE;
      textbox.set({
        fontSize: fontSize - 1,
        top: this.startY - fontSize - MAX_FONT_SIZE,
      });
    }

    this.canvas.add(label.rect);
    this.canvas.add(label.textbox);
    this.canvas.renderAll();
  }

  doMouseMove(event: fabric.IEvent): void {
    if (!this.isDown || !this.label) return;
    const pointer = this.pointer(event);
    const { rect, textbox } = this.label;
    const left = Math.min(this.startX, pointer.x);
    rect.set({
      left,
      top: Math.min(this.startY, pointer.y),
      width: Math.abs(this.startX - pointer.x),
      height: Math.abs(this.startY - pointer.y),
    });
    // The text sits above the rectangle, unless it is dragged upwards
    textbox.set({
      left,
      top: Math.min(this.startY - MAX_FONT_SIZE, pointer.y),
      width: rect.getScaledWidth(),
    });
    textbox.setCoords();
    rect.setCoords();
    this.canvas.renderAll();
  }

  doMouseUp(): void {
    this.isDown = false;
    this.canvas.renderAll();
  }

  type(): Tool {
    return Tool.RECTANGLE_LABEL;
  }
}
