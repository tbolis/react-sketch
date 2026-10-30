import type { ReactElement } from "react";
import { SketchField, type Types } from "react-sketch";
import Paper from "@mui/material/Paper";
import { teal } from "@mui/material/colors";
import defaultValue from "../../data/defaultValue";
import { CONFIG, type Config } from "../../stores/config";
import CanvasActions from "./CanvasActions";
import Drawings from "./Drawings";
import { ScenarioControls, ScenarioTabs } from "./Scenarios";
import { sketchRef, syncState } from "./sketchRef";

const style = { backgroundColor: teal[50] };

/** Stable, so that the canvas does not render again for it */
const showView = (view: Types.SketchView) => {
  CONFIG.view = view;
};

const SketchCanvas = (props: Config): ReactElement => {
  const controlled = props.scenario === "controlled-value";

  return (
    <Paper sx={{ width: "100%", height: "100%", p: 1, color: "text.secondary" }}>
      <ScenarioTabs scenario={props.scenario} />
      <ScenarioControls
        scenario={props.scenario}
        forceValue={props.forceValue}
        backgroundImageUrl={props.backgroundImageUrl}
      />
      <CanvasActions
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        hasSelection={props.hasSelection}
        canPaste={props.canPaste}
      />
      {/*
        SketchField is a pure component. The style and the callbacks do not change,
        so it renders again only when a property of the canvas changes, and not with the
        rest of the page (for example when it enables the undo button). That matters
        for forceValue, which loads the value again on every update of the canvas.
      */}
      <SketchField
        // A scenario starts on a fresh canvas
        key={props.scenario}
        ref={sketchRef}
        style={style}
        tool={props.selectedTool}
        lineColor={props.lineColor}
        lineWidth={props.lineWidth}
        lineStyle={props.lineStyle}
        pinchZoom={props.pinchZoom}
        minZoom={props.minZoom}
        maxZoom={props.maxZoom}
        onViewChange={showView}
        fillColor={props.fillWithColor ? props.fillColor : "transparent"}
        backgroundColor={
          props.fillWithBackgroundColor ? props.backgroundColor : "transparent"
        }
        width={props.controlledSize ? props.sketchWidth : undefined}
        height={props.controlledSize ? props.sketchHeight : undefined}
        backgroundImage={
          props.scenario === "background-image"
            ? props.backgroundImageUrl || undefined
            : undefined
        }
        // A new object on every render, with the same content: the canvas does not load the image again
        backgroundImageOptions={{
          stretched: props.stretched,
          stretchedX: props.stretchedX,
          stretchedY: props.stretchedY,
        }}
        defaultValue={props.scenario === "default-value" ? defaultValue : undefined}
        value={controlled ? props.controlledValue : undefined}
        forceValue={controlled && props.forceValue}
        // The canvas announces a change after drawing, undo, redo and loading a value
        onChange={syncState}
        // The selection changes with the mouse, and the objects with the actions
        onMouseUp={syncState}
        onObjectAdded={syncState}
        onObjectRemoved={syncState}
      />
      <Drawings drawings={props.drawings} />
    </Paper>
  );
};

export { SketchCanvas };
export default SketchCanvas;
