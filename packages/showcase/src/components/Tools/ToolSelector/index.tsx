import type { MouseEvent, ReactElement } from "react";
import { Types } from "react-sketch";
import SelectIcon from "@mui/icons-material/NearMe";
import PenIcon from "@mui/icons-material/Gesture";
import LineIcon from "@mui/icons-material/Straighten";
import ArrowIcon from "@mui/icons-material/NorthEast";
import RectangleIcon from "@mui/icons-material/CropSquare";
import RectangleLabelIcon from "@mui/icons-material/Label";
import CircleIcon from "@mui/icons-material/RadioButtonUnchecked";
import PanIcon from "@mui/icons-material/PanTool";
import HighlighterIcon from "@mui/icons-material/Highlight";
import EraserIcon from "@mui/icons-material/AutoFixNormal";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Section from "../Section";

interface ToolSelectorProps {
  selected: string;
  onChange?: (event: MouseEvent<HTMLElement>, value: string | null) => void;
}

const TOOLS = [
  { value: Types.Tool.SELECT, label: "Select", icon: <SelectIcon /> },
  { value: Types.Tool.PENCIL, label: "Pencil", icon: <PenIcon /> },
  { value: Types.Tool.LINE, label: "Line", icon: <LineIcon /> },
  { value: Types.Tool.ARROW, label: "Arrow", icon: <ArrowIcon /> },
  { value: Types.Tool.RECTANGLE, label: "Rectangle", icon: <RectangleIcon /> },
  {
    value: Types.Tool.RECTANGLE_LABEL,
    label: "Rectangle label",
    icon: <RectangleLabelIcon />,
  },
  { value: Types.Tool.CIRCLE, label: "Circle", icon: <CircleIcon /> },
  { value: Types.Tool.PAN, label: "Pan", icon: <PanIcon /> },
  { value: Types.Tool.HIGHLIGHTER, label: "Highlighter", icon: <HighlighterIcon /> },
  { value: Types.Tool.ERASER, label: "Eraser", icon: <EraserIcon /> },
];

const ToolSelector = (props: ToolSelectorProps): ReactElement => {
  return (
    <Section id="tool" title="Canvas Tool" chip={props.selected} defaultExpanded>
      <ToggleButtonGroup
        exclusive
        size="large"
        value={props.selected}
        sx={{ flexWrap: "wrap" }}
        onChange={props.onChange}>
        {TOOLS.map((tool) => (
          <ToggleButton
            key={tool.value}
            value={tool.value}
            aria-label={tool.label}
            title={tool.label}>
            {tool.icon}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Section>
  );
};

export default ToolSelector;
