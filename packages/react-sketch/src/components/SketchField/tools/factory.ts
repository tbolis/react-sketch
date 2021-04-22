import { fabric } from "fabric";
import { SketchProperties } from "../../../types";
import { Pencil } from "./Pencil";

export const initialize_tool = (
  canvas: fabric.Canvas,
  props: SketchProperties,
  tool: string
): Pencil => {
  const pencil: Pencil = new Pencil(canvas);
  pencil.configureCanvas(props);
  return pencil;
};
