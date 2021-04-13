/*eslint @typescript-eslint/no-unused-vars: 0,@typescript-eslint/no-empty-function: 0*/

import { fabric } from "fabric";
import { SketchProperties } from "../SketchField";
import { IEvent } from "fabric/fabric-impl";
import { Pencil } from "./Pencil";

/**
 * "Abstract" like base class for a Canvas tool
 */
export abstract class FabricCanvasTool {
  abstract configureCanvas(props: SketchProperties): void;

  doMouseUp(event: IEvent): void {}

  doMouseDown(event: IEvent): void {}

  doMouseMove(event: IEvent): void {}

  doMouseOut(event: IEvent): void {}
}

export const initialize_tool = (
  canvas: fabric.Canvas,
  props: SketchProperties,
  tool: string
): Pencil => {
  const pencil: Pencil = new Pencil(canvas);
  pencil.configureCanvas(props);
  return pencil;
};
