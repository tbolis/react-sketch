import type { ReactElement } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { CONFIG, type Config } from "../../../stores/config";
import LabeledSlider from "../LabeledSlider";
import Section from "../Section";

type CanvasSizeProps = Pick<
  Config,
  "controlledSize" | "sketchWidth" | "sketchHeight"
>;

/**
 * Control the width and the height of the canvas from the outside
 */
const CanvasSize = (props: CanvasSizeProps): ReactElement => {
  return (
    <Section
      id="size"
      title="Canvas Size"
      chip={
        props.controlledSize
          ? `${props.sketchWidth} x ${props.sketchHeight}`
          : "auto"
      }>
      <FormControlLabel
        label="Control size"
        control={
          <Switch
            checked={props.controlledSize}
            onChange={(event) => (CONFIG.controlledSize = event.target.checked)}
          />
        }
      />
      <LabeledSlider
        label="Change Canvas Width"
        value={props.sketchWidth}
        min={10}
        max={1000}
        disabled={!props.controlledSize}
        onChange={(value) => (CONFIG.sketchWidth = value)}
      />
      <LabeledSlider
        label="Change Canvas Height"
        value={props.sketchHeight}
        min={10}
        max={1000}
        disabled={!props.controlledSize}
        onChange={(value) => (CONFIG.sketchHeight = value)}
      />
    </Section>
  );
};

export default CanvasSize;
