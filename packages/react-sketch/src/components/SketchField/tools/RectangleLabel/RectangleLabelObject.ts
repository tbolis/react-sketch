import * as fabric from "fabric";
import { CanvasEvent } from "../../events";

/**
 * A rectangle with a text box on top of it. The text box follows the
 * rectangle when it is moved or scaled.
 */
export class RectangleLabelObject {
  readonly rect: fabric.Rect;
  readonly textbox: fabric.Textbox;

  constructor(
    canvas: fabric.Canvas,
    text: string,
    rectProps: Partial<fabric.RectProps>,
    textProps: Partial<fabric.TextboxProps>
  ) {
    this.rect = new fabric.Rect(rectProps);
    this.textbox = new fabric.Textbox(text, textProps);
    canvas.on("object:scaling", this.update);
    canvas.on("object:moving", this.update);
  }

  update = (event: CanvasEvent): void => {
    if (event.target !== this.rect) return;
    this.textbox.set({
      width: this.rect.getScaledWidth(),
      scaleX: 1,
      scaleY: 1,
      top: (this.rect.top ?? 0) - this.textbox.getScaledHeight(),
      left: this.rect.left,
    });
  };

  setText(text: string): void {
    this.textbox.set({ text });
  }
}
