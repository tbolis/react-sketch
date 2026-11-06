import type { ReactElement } from "react";
import { Types } from "react-sketch";
import ArrowIcon from "@mui/icons-material/NorthEast";
import BucketFillIcon from "@mui/icons-material/FormatColorFill";
import CircleIcon from "@mui/icons-material/RadioButtonUnchecked";
import EraserIcon from "@mui/icons-material/AutoFixNormal";
import HighlighterIcon from "@mui/icons-material/Highlight";
import LaserPointerIcon from "@mui/icons-material/AdsClick";
import LineIcon from "@mui/icons-material/HorizontalRule";
import PanIcon from "@mui/icons-material/PanTool";
import PenIcon from "@mui/icons-material/Gesture";
import PolygonIcon from "@mui/icons-material/Pentagon";
import RectangleIcon from "@mui/icons-material/CropSquare";
import RectangleLabelIcon from "@mui/icons-material/Label";
import SelectIcon from "@mui/icons-material/NearMe";

export interface ToolInfo {
  value: Types.Tool;
  label: string;
  /** The key which selects the tool */
  key: string;
  /** What to do with the tool, shown at the bottom of the canvas */
  hint: string;
  icon: ReactElement;
}

/** The tools in groups, as the toolbar shows them: moving, shapes, and brushes */
export const TOOL_GROUPS: ToolInfo[][] = [
  [
    {
      value: Types.Tool.SELECT,
      label: "Select",
      key: "v",
      hint: "Click an object to select it. Drag to move it, use its handles to scale and rotate.",
      icon: <SelectIcon />,
    },
    {
      value: Types.Tool.PAN,
      label: "Pan",
      key: "h",
      hint: "Drag to move the canvas.",
      icon: <PanIcon />,
    },
  ],
  [
    {
      value: Types.Tool.RECTANGLE,
      label: "Rectangle",
      key: "r",
      hint: "Drag to draw a rectangle.",
      icon: <RectangleIcon />,
    },
    {
      value: Types.Tool.RECTANGLE_LABEL,
      label: "Rectangle label",
      key: "b",
      hint: "Drag to draw a rectangle with a text box. The text box follows the rectangle.",
      icon: <RectangleLabelIcon />,
    },
    {
      value: Types.Tool.CIRCLE,
      label: "Circle",
      key: "o",
      hint: "Drag to draw a circle.",
      icon: <CircleIcon />,
    },
    {
      value: Types.Tool.POLYGON,
      label: "Polygon",
      key: "g",
      hint: "Click to add points. Close it with the first point, a double click or Enter. Esc cancels.",
      icon: <PolygonIcon />,
    },
    {
      value: Types.Tool.LINE,
      label: "Line",
      key: "l",
      hint: "Drag to draw a line.",
      icon: <LineIcon />,
    },
    {
      value: Types.Tool.ARROW,
      label: "Arrow",
      key: "a",
      hint: "Drag to draw an arrow.",
      icon: <ArrowIcon />,
    },
  ],
  [
    {
      value: Types.Tool.PENCIL,
      label: "Pencil",
      key: "p",
      hint: "Drag to draw freehand.",
      icon: <PenIcon />,
    },
    {
      value: Types.Tool.HIGHLIGHTER,
      label: "Highlighter",
      key: "m",
      hint: "Drag to highlight with a wide, translucent line.",
      icon: <HighlighterIcon />,
    },
    {
      value: Types.Tool.ERASER,
      label: "Eraser",
      key: "e",
      hint: "Drag over the drawing to erase it.",
      icon: <EraserIcon />,
    },
    {
      value: Types.Tool.BUCKET_FILL,
      label: "Bucket fill",
      key: "f",
      hint: "Click inside a closed shape to fill it with the fill color. The lines around it must meet: a gap lets the color out, and nothing is filled.",
      icon: <BucketFillIcon />,
    },
    {
      value: Types.Tool.LASER_POINTER,
      label: "Laser pointer",
      key: "k",
      hint: "Drag to point at something. The line fades out and is not part of the drawing: it is not saved, exported or undone. It has the color and the weight of the line.",
      icon: <LaserPointerIcon />,
    },
  ],
];

export const TOOLS: ToolInfo[] = TOOL_GROUPS.flat();

/** The number keys select the first nine tools, in the order of the toolbar */
export const toolDigit = (tool: ToolInfo): string | undefined => {
  const index = TOOLS.indexOf(tool);
  return index >= 0 && index < 9 ? String(index + 1) : undefined;
};

export const toolByValue = (value: string): ToolInfo | undefined =>
  TOOLS.find((tool) => tool.value === value);
