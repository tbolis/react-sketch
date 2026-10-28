import type { MouseEvent, ReactElement } from "react";
import { Types } from "react-sketch";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Paper from "@mui/material/Paper";
import { CONFIG, type Config } from "../../stores/config";
import Background from "./Background";
import CanvasSize from "./CanvasSize";
import ColorSelector from "./ColorSelector";
import ImageControls from "./ImageControls";
import LabeledSlider from "./LabeledSlider";
import Overlay from "./Overlay";
import Section from "./Section";
import TextControls from "./TextControls";
import ToolSelector from "./ToolSelector";

interface LineSettings {
  lineColor: string;
  lineWidth: number;
}

/** The line of the laser pointer, a thin black one is hardly seen */
let laserLine: LineSettings = { lineColor: "#ff0000", lineWidth: 8 };
/** The line of the other tools, kept while the laser pointer is in use */
let otherLine: LineSettings = {
  lineColor: CONFIG.lineColor,
  lineWidth: CONFIG.lineWidth,
};

const swapLine = (leaving: LineSettings): LineSettings => {
  const { lineColor, lineWidth } = CONFIG;
  Object.assign(CONFIG, leaving);
  return { lineColor, lineWidth };
};

/**
 * Handle the selection of the Sketch tool
 *
 * @param {object} event The event source of the callback.
 * @param {string | null} value of the selected buttons, null when the selected one is clicked again
 */
const handleSelectTool = (event: MouseEvent<HTMLElement>, value: string | null) => {
  if (value === null) return;
  const laser = Types.Tool.LASER_POINTER;
  // The laser pointer keeps its own color and weight, apart from the other tools
  if (value === laser && CONFIG.selectedTool !== laser) {
    otherLine = swapLine(laserLine);
  } else if (value !== laser && CONFIG.selectedTool === laser) {
    laserLine = swapLine(otherLine);
  }
  CONFIG.selectedTool = value;
};

const SketchTools = (props: Config): ReactElement => {
  return (
    <Paper sx={{ p: 1, color: "text.secondary" }}>
      <ToolSelector selected={props.selectedTool} onChange={handleSelectTool} />
      <Section
        id="stroke"
        title="Line"
        chip={`${props.lineWidth}px`}
        defaultExpanded>
        <LabeledSlider
          label="Line Weight"
          value={props.lineWidth}
          min={1}
          max={100}
          startIcon={<RemoveIcon />}
          endIcon={<AddIcon />}
          onChange={(value) => (CONFIG.lineWidth = value)}
        />
      </Section>
      <ColorSelector
        lineColor={props.lineColor}
        fillWithColor={props.fillWithColor}
        fillColor={props.fillColor}
      />
      <CanvasSize
        controlledSize={props.controlledSize}
        sketchWidth={props.sketchWidth}
        sketchHeight={props.sketchHeight}
      />
      <Background
        fillWithBackgroundColor={props.fillWithBackgroundColor}
        backgroundColor={props.backgroundColor}
        stretched={props.stretched}
        stretchedX={props.stretchedX}
        stretchedY={props.stretchedY}
      />
      <Overlay />
      <TextControls text={props.text} />
      <ImageControls imageUrl={props.imageUrl} imageCors={props.imageCors} />
    </Paper>
  );
};

export { SketchTools };
export default SketchTools;
