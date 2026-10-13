import type { MouseEvent, ReactElement } from "react";
import ToolSelector from "./ToolSelector";
import Paper from "@mui/material/Paper";
import { CONFIG, type Config } from "../../stores/config";
import LineWidth from "./LineWidth";

/**
 * Handle the selection of the Sketch tool
 *
 * @param {object} event The event source of the callback.
 * @param {string | null} value of the selected buttons, null when the selected one is clicked again
 */
const handleSelectTool = (event: MouseEvent<HTMLElement>, value: string | null) => {
  if (value !== null) {
    CONFIG.selectedTool = value;
  }
};

const handleLineWidth = (event: Event, value: number | number[]) => {
  if (!Array.isArray(value)) {
    CONFIG.lineWidth = value;
  }
};

const SketchTools = (props: Config): ReactElement => {
  return (
    <Paper sx={{ p: 1, color: "text.secondary" }}>
      <ToolSelector selected={props.selectedTool} onChange={handleSelectTool} />
      <LineWidth width={props.lineWidth} onChange={handleLineWidth} />
    </Paper>
  );
};

export { SketchTools };
export default SketchTools;
