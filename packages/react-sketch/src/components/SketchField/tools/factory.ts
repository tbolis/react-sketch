import * as fabric from "fabric";
import { SketchProperties, Tool } from "../../../types";
import { FabricCanvasTool } from "./index";
import { Arrow } from "./Arrow";
import { Circle } from "./Circle";
import { DefaultTool } from "./DefaultTool";
import { Eraser } from "./Eraser";
import { Highlighter } from "./Highlighter";
import { LaserPointer } from "./LaserPointer";
import { Line } from "./Line";
import { Pan } from "./Pan";
import { Pencil } from "./Pencil";
import { Rectangle } from "./Rectangle";
import { RectangleLabel } from "./RectangleLabel";
import { Select } from "./Select";

/**
 * Factory to create the corresponding tool based on the prop passed to
 * the Component. Unknown tools fall back to the Pencil.
 *
 * @param {fabric.Canvas} canvas the fabric Canvas instance instantiated
 * @param {SketchProperties} props defined to SketchField
 */
export const create_tool = (
  canvas: fabric.Canvas,
  props: SketchProperties
): FabricCanvasTool => {
  let toolInstance: FabricCanvasTool;

  switch (props.tool) {
    case Tool.CIRCLE:
      toolInstance = new Circle(canvas);
      break;
    case Tool.LINE:
      toolInstance = new Line(canvas);
      break;
    case Tool.ARROW:
      toolInstance = new Arrow(canvas);
      break;
    case Tool.RECTANGLE:
      toolInstance = new Rectangle(canvas);
      break;
    case Tool.RECTANGLE_LABEL:
      toolInstance = new RectangleLabel(canvas);
      break;
    case Tool.SELECT:
      toolInstance = new Select(canvas);
      break;
    case Tool.PAN:
      toolInstance = new Pan(canvas);
      break;
    case Tool.HIGHLIGHTER:
      toolInstance = new Highlighter(canvas);
      break;
    case Tool.ERASER:
      toolInstance = new Eraser(canvas);
      break;
    case Tool.LASER_POINTER:
      toolInstance = new LaserPointer(canvas);
      break;
    case Tool.DEFAULT_TOOL:
      toolInstance = new DefaultTool(canvas);
      break;
    case Tool.PENCIL:
    default:
      toolInstance = new Pencil(canvas);
  }

  // Bring the cursors back to default, in case the previous tool changed them
  canvas.defaultCursor = "default";
  canvas.freeDrawingCursor = "crosshair";
  toolInstance.configureCanvas(props);
  return toolInstance;
};
