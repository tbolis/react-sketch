import { fabric } from "fabric";
import { SketchProperties, Tool } from "../../../types";
import { FabricCanvasTool } from "./index";
import { Pencil } from "./Pencil";
import { Line } from "./Line";

/**
 * Factory to create the corresponding tool based on the prop passed to
 * the Component
 *
 * @param {fabric.Canvas} canvas the fabric Canvas instance instantiated
 * @param {SketchProperties} props defined to SketchField
 */
export const create_tool = (
  canvas: fabric.Canvas,
  props: SketchProperties
): FabricCanvasTool => {
  console.log(props);
  const tool = props.tool;
  console.log(tool);
  let toolInstance: FabricCanvasTool | null = null;

  switch (tool) {
    default:
    case Tool.PENCIL:
      toolInstance = new Pencil(canvas);
      break;
    case Tool.CIRCLE:
      break;
    case Tool.LINE:
      toolInstance = new Line(canvas);
      break;
    case Tool.ARROW:
      break;
    case Tool.RECTANGLE:
      break;
    case Tool.SELECT:
      break;
    case Tool.PAN:
      break;
    case Tool.HIGHLIGHTER:
      break;
  }

  if (!toolInstance) {
    throw new Error();
  }

  toolInstance.configureCanvas(props);
  return toolInstance;
};
