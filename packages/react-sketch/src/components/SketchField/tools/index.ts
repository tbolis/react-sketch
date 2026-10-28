/*eslint @typescript-eslint/no-unused-vars: 0,@typescript-eslint/no-empty-function: 0*/

import * as fabric from "fabric";
import { LineStyle, SketchProperties, Tool } from "../../../types";
import { lineStroke } from "../../../utils";
import { EraserBrush } from "@react-sketch/eraser";
import { CanvasEvent, EventInput } from "../events";

/**
 * Interface to support canvas events
 */
export interface CanvasEventAware {
  // Mouse events
  onMouseUp(input: EventInput): void;
  onMouseDown(input: EventInput): void;
  onMouseMove(input: EventInput): void;
  onMouseOut(input: EventInput): void;

  // Object management
  onObjectMoved(input: EventInput): void;
  onObjectModified(input: EventInput): void;
  onObjectRemoved(input: EventInput): void;
  onObjectMoving(input: EventInput): void;
  onObjectScaling(input: EventInput): void;
  onObjectRotating(input: EventInput): void;

  // IText Events fired on Adding Text
  onTextChanged(input: EventInput): void;
  onTextSelectionChanged(input: EventInput): void;
  onTextEditingEntered(input: EventInput): void;
  onTextEditingExited(input: EventInput): void;
}

/**
 * Abstract implementation of canvas events
 */
export abstract class AbstractEventAware implements CanvasEventAware {
  onMouseDown(input: EventInput): void {}

  onMouseMove(input: EventInput): void {}

  onMouseOut(input: EventInput): void {}

  onMouseUp(input: EventInput): void {}

  onObjectModified(input: EventInput): void {}

  onObjectMoved(input: EventInput): void {}

  onObjectMoving(input: EventInput): void {}

  onObjectRemoved(input: EventInput): void {}

  onObjectRotating(input: EventInput): void {}

  onObjectScaling(input: EventInput): void {}

  onTextChanged(input: EventInput): void {}

  onTextEditingEntered(input: EventInput): void {}

  onTextEditingExited(input: EventInput): void {}

  onTextSelectionChanged(input: EventInput): void {}
}

/**
 * "Abstract" like base class for a Canvas tool
 */
export abstract class FabricCanvasTool {
  private readonly _canvas: fabric.Canvas;

  protected constructor(canvas: fabric.Canvas) {
    this._canvas = canvas;
  }

  abstract type(): Tool;

  abstract configureCanvas(props: SketchProperties): void;

  /**
   * Called when what the pointer started, with the mouse down, must not
   * go on or end in something drawn (two fingers on the screen are a gesture
   * of the view, not a stroke). The objects it added are taken off the canvas.
   */
  cancel(): void {}

  /**
   * Called when another tool takes over, before `dispose()`, for the tools
   * which have something unfinished to complete (it is not called when the
   * canvas goes away)
   */
  finish(): void {}

  /**
   * Called when another tool takes over, and when the canvas goes away, for
   * the tools which keep something running on the canvas
   */
  dispose(): void {}

  /**
   * Called when the content of the canvas is replaced (it is cleared, a value
   * is loaded, an undo or a redo is done), for the tools which hold something
   * drawn on it
   */
  reset(): void {}

  /**
   * Whether the object is one which the tool shows while it draws, and takes
   * off for the final one. It is not an action of the user, so it is not in
   * the history, and `onObjectAdded` and `onObjectRemoved` are not called for it.
   */
  isPreview(object: fabric.FabricObject): boolean {
    return false;
  }

  /**
   * Called when the sketch scales its objects (`zoom()`, and the resize of the
   * canvas), for the tools which hold coordinates of their own
   */
  scale(xFactor: number, yFactor: number): void {}

  /**
   * Whether the application is told about a change (`onChange`) when the
   * mouse is released or leaves the canvas. The tools which do not change the
   * sketch on every release say no, and tell the application themselves.
   */
  notifiesChange(): boolean {
    return true;
  }

  doMouseUp(event: CanvasEvent): void {}

  doMouseDown(event: CanvasEvent): void {}

  doMouseMove(event: CanvasEvent): void {}

  doMouseOut(event: CanvasEvent): void {}

  get canvas(): fabric.Canvas {
    return this._canvas;
  }

  /**
   * Position of the given canvas event, in canvas coordinates
   */
  protected pointer(event: CanvasEvent): { x: number; y: number } {
    return this.canvas.getScenePoint(event.e as fabric.TPointerEvent);
  }

  /**
   * The brush of the free drawing tools. Fabric does not create one by
   * itself, so it is created the first time it is needed. The brush of the
   * eraser is not one to draw with, it is replaced.
   */
  protected get brush(): fabric.BaseBrush {
    const current = this.canvas.freeDrawingBrush;
    if (current && !(current instanceof EraserBrush)) return current;
    current?.dispose();
    return (this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas));
  }

  /**
   * Set the line style of the brush. The brush is kept from a tool to the
   * next, so a tool which does not draw a style (the highlighter) calls this
   * with none, and the style of the pencil is not left on it.
   */
  protected setBrushStroke(style: LineStyle | undefined, width: number): void {
    const brush = this.brush;
    brush.strokeDashArray = null;
    brush.strokeLineCap = "round";
    Object.assign(brush, lineStroke(style, width));
  }

  /**
   * Switch the canvas between "select" mode (objects can be selected and
   * moved) and "draw" mode (objects are frozen, so a drag always draws).
   * Free drawing is turned off in both.
   */
  protected setInteractive(interactive: boolean): void {
    this.canvas.isDrawingMode = false;
    this.canvas.selection = interactive;
    this.canvas.forEachObject((o) => (o.selectable = o.evented = interactive));
  }
}
