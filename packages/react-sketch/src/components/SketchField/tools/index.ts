/*eslint @typescript-eslint/no-unused-vars: 0,@typescript-eslint/no-empty-function: 0*/

import { fabric } from "fabric";
import { IEvent } from "fabric/fabric-impl";
import { SketchProperties, Tool } from "../../../types";
import { EventInput } from "../events";

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

  doMouseUp(event: IEvent): void {}

  doMouseDown(event: IEvent): void {}

  doMouseMove(event: IEvent): void {}

  doMouseOut(event: IEvent): void {}

  get canvas(): fabric.Canvas {
    return this._canvas;
  }
}
