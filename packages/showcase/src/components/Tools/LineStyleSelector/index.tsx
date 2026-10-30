import type { MouseEvent, ReactElement } from "react";
import { Types } from "react-sketch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { CONFIG } from "../../../stores/config";

interface LineStyleSelectorProps {
  selected: Types.LineStyle;
  /** Whether the tool in use draws the style, the highlighter, the eraser and the laser pointer do not */
  disabled?: boolean;
}

/** A sample of each style: the dashes of the line, as the canvas draws them with a line of 2 */
const STYLES: {
  value: Types.LineStyle;
  label: string;
  dash?: string;
  round?: boolean;
}[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed", dash: "6 4" },
  { value: "dotted", label: "Dotted", dash: "0 4", round: true },
  { value: "dash-dot", label: "Dash and dot", dash: "4 6 0 6", round: true },
];

const handleChange = (
  _event: MouseEvent<HTMLElement>,
  value: Types.LineStyle | null
) => {
  if (value !== null) CONFIG.lineStyle = value;
};

const LineStyleSelector = ({
  selected,
  disabled,
}: LineStyleSelectorProps): ReactElement => {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      fullWidth
      disabled={disabled}
      value={selected}
      aria-label="Line style"
      sx={{ mt: 1 }}
      onChange={handleChange}>
      {STYLES.map(({ value, label, dash, round }) => (
        <ToggleButton
          key={value}
          value={value}
          aria-label={label}
          title={disabled ? "This tool has no line style" : label}>
          <svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true">
            <line
              x1="2"
              y1="5"
              x2="38"
              y2="5"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={dash}
              strokeLinecap={round ? "round" : "butt"}
            />
          </svg>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default LineStyleSelector;
