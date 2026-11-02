import * as fabric from "fabric";
import { CanvasEvent } from "../../events";

/** The label of each rectangle, so that the listeners of a canvas serve all of its labels */
const labels = new WeakMap<fabric.FabricObject, RectangleLabelObject>();

/** The canvases which already have those listeners */
const following = new WeakSet<fabric.Canvas>();

/**
 * Make the labels of the canvas follow their rectangles. A label stays with its
 * rectangle when it is taken off the canvas and put back (undo, redo), so the
 * listeners are not removed with it: there are two for each canvas, not for each label.
 */
const follow = (canvas: fabric.Canvas): void => {
  if (following.has(canvas)) return;
  following.add(canvas);
  const update = ({ target }: CanvasEvent): void => {
    if (target) labels.get(target)?.update();
  };
  canvas.on("object:scaling", update);
  canvas.on("object:moving", update);
};

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
    labels.set(this.rect, this);
    follow(canvas);
  }

  update(): void {
    this.textbox.set({
      width: this.rect.getScaledWidth(),
      scaleX: 1,
      scaleY: 1,
      top: (this.rect.top ?? 0) - this.textbox.getScaledHeight(),
      left: this.rect.left,
    });
  }

  setText(text: string): void {
    this.textbox.set({ text });
  }
}
