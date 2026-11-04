import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, RefObject } from "react";
import { SketchField, type Types } from "react-sketch";
import Box from "@mui/material/Box";
import { observer } from "mobx-react-lite";
import defaultValue from "../data/defaultValue";
import { CONFIG, type Size } from "../stores/config";
import { syncChange, sketchRef, syncState } from "../sketchRef";
import { centerScene } from "../utils/scene";

/**
 * The drawing surface stays light in both color schemes, so that the colors of the
 * strokes are the ones which the exported image has
 */
const SURFACE = "#ffffff";

const GRID = 20;

/** Stable, so that the canvas does not render again for it */
const style = { backgroundColor: SURFACE };

/** The surface with a grid behind the drawing, which the exported image does not have */
const gridStyle = {
  backgroundColor: SURFACE,
  backgroundImage:
    "linear-gradient(#0000001f 1px, transparent 1px), linear-gradient(90deg, #0000001f 1px, transparent 1px)",
  backgroundSize: `${GRID}px ${GRID}px`,
};

const showView = (view: Types.SketchView) => {
  CONFIG.view = view;
};

/**
 * The size of the element, as it changes. Nothing is reported before the first
 * measure, which is made before the page is painted.
 */
const useElementSize = (): [RefObject<HTMLDivElement | null>, Size | null] => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () =>
      setSize((previous) => {
        const { clientWidth: width, clientHeight: height } = element;
        return previous?.width === width && previous.height === height
          ? previous
          : { width, height };
      });
    measure();
    // The canvas scales its drawing to a new size, so a resize is followed one frame at a time
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, size];
};

/**
 * The canvas: it fills the window, with the panels floating over it. Or, with the
 * size controlled, it is a sheet of that size in the middle of the window.
 */
const Workspace = observer((): ReactElement => {
  const [hostRef, hostSize] = useElementSize();
  const {
    scenario,
    controlledSize,
    sketchWidth,
    sketchHeight,
    grid,
    controlledValue,
    forceValue,
  } = CONFIG;
  const controlled = scenario === "controlled-value";

  const canvasSize: Size | null = controlledSize
    ? { width: sketchWidth, height: sketchHeight }
    : hostSize;
  const width = canvasSize?.width;
  const height = canvasSize?.height;

  // The sample drawing is put in the middle of the canvas the scenario starts with.
  // The canvas loads the default value only when it mounts, so later sizes are not used
  const sceneValue = useMemo(
    () =>
      scenario === "default-value" && width && height
        ? centerScene(defaultValue, { width, height })
        : undefined,
    [scenario, width, height]
  );

  // The scenarios which need the size of the canvas read it from the store
  useLayoutEffect(() => {
    if (width && height) CONFIG.canvasSize = { width, height };
  }, [width, height]);

  return (
    <Box
      ref={hostRef}
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        // The grid of the workspace, around a sheet
        backgroundImage:
          "radial-gradient(circle, var(--mui-palette-divider) 1px, transparent 1px)",
        backgroundSize: `${GRID}px ${GRID}px`,
      }}>
      {/* The canvas can only be sized once the window is: it scales its drawing to every size */}
      {width && height ? (
        <Box
          data-testid="sketch-surface"
          sx={{
            position: "relative",
            flexShrink: 0,
            width,
            height,
            bgcolor: SURFACE,
            boxShadow: controlledSize ? 4 : "none",
          }}>
          {/*
            SketchField is a pure component. The style and the callbacks do not change,
            so it renders again only when a property of the canvas changes, and not with
            the rest of the page (for example when it enables the undo button). That
            matters for forceValue, which loads the value again on every update of the
            canvas.
          */}
          <SketchField
            // A scenario starts on a fresh canvas
            key={scenario}
            ref={sketchRef}
            style={grid ? gridStyle : style}
            // The size is given by the properties, one way to follow the window
            autoresize={false}
            width={width}
            height={height}
            tool={CONFIG.selectedTool}
            lineColor={CONFIG.lineColor}
            lineWidth={CONFIG.lineWidth}
            lineStyle={CONFIG.lineStyle}
            pinchZoom={CONFIG.pinchZoom}
            minZoom={CONFIG.minZoom}
            maxZoom={CONFIG.maxZoom}
            onViewChange={showView}
            fillColor={CONFIG.fillWithColor ? CONFIG.fillColor : "transparent"}
            backgroundColor={
              CONFIG.fillWithBackgroundColor ? CONFIG.backgroundColor : "transparent"
            }
            backgroundImage={
              scenario === "background-image"
                ? CONFIG.backgroundImageUrl || undefined
                : undefined
            }
            // A new object on every render, with the same content: the canvas does not load the image again
            backgroundImageOptions={{
              stretched: CONFIG.stretched,
              stretchedX: CONFIG.stretchedX,
              stretchedY: CONFIG.stretchedY,
            }}
            defaultValue={sceneValue}
            value={controlled ? controlledValue : undefined}
            forceValue={controlled && forceValue}
            // The canvas announces a change after drawing, undo, redo and loading a value
            onChange={syncChange}
            // The selection changes with the mouse, and the objects with the actions
            onMouseUp={syncState}
            onObjectAdded={syncChange}
            onObjectRemoved={syncChange}
          />
        </Box>
      ) : null}
    </Box>
  );
});

export default Workspace;
