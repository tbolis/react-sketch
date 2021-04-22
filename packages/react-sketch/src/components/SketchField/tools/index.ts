/*eslint @typescript-eslint/no-unused-vars: 0,@typescript-eslint/no-empty-function: 0*/

import { fabric } from "fabric";
import { IEvent } from "fabric/fabric-impl";
import { Pencil } from "./Pencil";
import { SketchProperties } from "../../../types";

/**
 * "Abstract" like base class for a Canvas tool
 */
export abstract class FabricCanvasTool {
  private readonly _canvas: fabric.Canvas;

  protected constructor(canvas: fabric.Canvas) {
    this._canvas = canvas;
  }

  abstract configureCanvas(props: SketchProperties): void;

  doMouseUp(event: IEvent): void {}

  doMouseDown(event: IEvent): void {}

  doMouseMove(event: IEvent): void {}

  doMouseOut(event: IEvent): void {}

  get canvas(): fabric.Canvas {
    return this._canvas;
  }
}

/**
 * "Abstract" like base class for a Canvas tool
 */
export abstract class FabricCanvasTool2 {
  protected constructor(canvas: fabric.Canvas) {}
}
