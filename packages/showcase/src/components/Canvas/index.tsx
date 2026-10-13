import type { ReactElement } from "react";
import { SketchField, Types } from "react-sketch";
import Paper from "@mui/material/Paper";
import { teal } from "@mui/material/colors";
import defaultValue from "../../data/defaultValue";
import { Config } from "../../stores/config";
import { sketchRef, syncHistory, withSketch, type SketchApi } from "./api";
import CanvasActions from "./CanvasActions";
import Drawings from "./Drawings";
import { ScenarioControls, ScenarioTabs } from "./Scenarios";

// TODO(part2): SketchField does not expose the ref API in its types yet, remove the cast
const bindSketch = (instance: SketchField | null): void => {
  sketchRef.current = instance as unknown as SketchApi | null;
};

const SketchCanvas = (props: Config): ReactElement => {
  const properties: Types.SketchProperties = {
    tool: props.selectedTool,
    lineColor: props.lineColor,
    lineWidth: props.lineWidth,
    fillColor: props.fillWithColor ? props.fillColor : "transparent",
    backgroundColor: props.fillWithBackgroundColor
      ? props.backgroundColor
      : "transparent",
    width: props.controlledSize ? props.sketchWidth : undefined,
    height: props.controlledSize ? props.sketchHeight : undefined,
    autoresize: true,
  };

  // TODO(part2): these props are not part of Types.SketchProperties yet, move them to
  // `properties` once the library types them
  const upcoming = {
    opacity: props.opacity,
    onChange: () => withSketch(syncHistory),
    ...(props.scenario === "default-value" && { defaultValue }),
    ...(props.scenario === "controlled-value" && {
      value: props.controlledValue,
      forceValue: props.forceValue,
    }),
  };

  return (
    <Paper sx={{ width: "100%", height: "100%", p: 1, color: "text.secondary" }}>
      <ScenarioTabs scenario={props.scenario} />
      <ScenarioControls scenario={props.scenario} forceValue={props.forceValue} />
      <CanvasActions
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        selectedTool={props.selectedTool}
      />
      <SketchField
        // A scenario starts on a fresh canvas
        key={props.scenario}
        ref={bindSketch}
        style={{ backgroundColor: teal[50] }}
        {...properties}
        {...upcoming}
      />
      <Drawings drawings={props.drawings} />
    </Paper>
  );
};

export { SketchCanvas };
export default SketchCanvas;
