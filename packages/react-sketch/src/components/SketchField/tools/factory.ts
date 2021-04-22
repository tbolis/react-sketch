import { fabric } from "fabric";
import { SketchProperties } from "../../../types";
import { Pencil } from "./Pencil";
import { FabricCanvasTool } from "./index";

export const initialize_tool = (
  canvas: fabric.Canvas,
  props: SketchProperties,
  tool: string
): FabricCanvasTool => {
  const pencil: Pencil = new Pencil(canvas);
  pencil.configureCanvas(props);
  return pencil;
};
