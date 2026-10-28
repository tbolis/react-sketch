/*eslint @typescript-eslint/no-unused-vars: 0,@typescript-eslint/no-empty-function: 0*/

import * as fabric from "fabric";
import { SketchProperties, Tool } from "../../../types";
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
