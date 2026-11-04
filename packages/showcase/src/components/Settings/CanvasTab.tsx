import { useState } from "react";
import type { DragEvent, ReactElement } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { withSketch } from "../../sketchRef";
import { CONFIG } from "../../stores/config";
import { readAsDataUrl } from "../../utils/files";
import ColorPicker from "../ColorPicker";
import LabeledSlider from "../LabeledSlider";
import Section from "./Section";

export const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
} as const;

/**
 * Use the image as the background of the canvas, fitted as the switches say
 */
const setBackground = (dataUrl: string): void => {
  const { stretched, stretchedX, stretchedY } = CONFIG;
  withSketch((sketch) =>
    sketch.setBackgroundFromDataUrl(dataUrl, {
      stretched,
      stretchedX,
      stretchedY,
      originX: "left",
      originY: "top",
    })
  );
};

/**
 * Use the first image of the files as the background of the canvas
 */
const setBackgroundImage = async (files: FileList | null): Promise<void> => {
  const image = Array.from(files ?? []).find((file) =>
    file.type.startsWith("image/")
  );
  if (image) setBackground(await readAsDataUrl(image));
};

/**
 * The fit is applied when an image is set, so a switch sets the image of the
 * canvas again. Nothing happens when the canvas has no background image.
 */
const setFit = (
  fit: "stretched" | "stretchedX" | "stretchedY",
  on: boolean
): void => {
  CONFIG[fit] = on;
  withSketch((sketch) => {
    const { src } = (sketch.toJSON().backgroundImage ?? {}) as { src?: string };
    if (src) setBackground(src);
  });
};

const DropArea = (): ReactElement => {
  const [active, setActive] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setActive(false);
    void setBackgroundImage(event.dataTransfer.files);
  };

  return (
    <Box
      component="label"
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={handleDrop}
      sx={{
        display: "block",
        position: "relative",
        p: 2,
        textAlign: "center",
        cursor: "pointer",
        border: "2px dashed",
        borderStyle: active ? "solid" : "dashed",
        borderColor: active ? "primary.main" : "text.disabled",
        borderRadius: 2,
        "&:focus-within": { outline: "2px solid", outlineColor: "primary.main" },
      }}>
      <Typography variant="body2">
        Try dropping an image here, or click to select an image as background.
      </Typography>
      <Box
        component="input"
        type="file"
        accept="image/*"
        sx={visuallyHidden}
        onChange={(event) => {
          void setBackgroundImage(event.target.files);
          event.target.value = "";
        }}
      />
    </Box>
  );
};

const Switches = ({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <FormControlLabel
    label={label}
    disabled={disabled}
    control={
      <Switch
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    }
  />
);

/**
 * The size, the background and the view of the canvas
 */
const CanvasTab = observer((): ReactElement => {
  const {
    controlledSize,
    sketchWidth,
    sketchHeight,
    fillWithBackgroundColor,
    backgroundColor,
    stretched,
    stretchedX,
    stretchedY,
    pinchZoom,
    minZoom,
    maxZoom,
    view,
    grid,
  } = CONFIG;

  return (
    <Box>
      <Section
        title="Canvas size"
        chip={controlledSize ? `${sketchWidth} x ${sketchHeight}` : "auto"}>
        <Typography variant="body2" color="text.secondary">
          By default the canvas fills the window. A size takes the width and the
          height from the properties instead.
        </Typography>
        <Switches
          label="Control size"
          checked={controlledSize}
          onChange={(checked) => (CONFIG.controlledSize = checked)}
        />
        <LabeledSlider
          label="Change Canvas Width"
          value={sketchWidth}
          min={10}
          max={1000}
          disabled={!controlledSize}
          onChange={(value) => (CONFIG.sketchWidth = value)}
        />
        <LabeledSlider
          label="Change Canvas Height"
          value={sketchHeight}
          min={10}
          max={1000}
          disabled={!controlledSize}
          onChange={(value) => (CONFIG.sketchHeight = value)}
        />
      </Section>
      <Divider />
      <Section
        title="Background"
        chip={fillWithBackgroundColor ? backgroundColor : "none"}>
        <ColorPicker
          label="Background color"
          allowNone
          value={fillWithBackgroundColor ? backgroundColor : null}
          fallback={backgroundColor}
          onChange={(color) => {
            CONFIG.fillWithBackgroundColor = color !== null;
            if (color) CONFIG.backgroundColor = color;
          }}
        />
        <Typography variant="body2" sx={{ pt: 1 }}>
          Set Image Background
        </Typography>
        <Box>
          <Switches
            label="Fit canvas (X,Y)"
            checked={stretched}
            onChange={(on) => setFit("stretched", on)}
          />
          <Switches
            label="Fit canvas (X)"
            checked={stretchedX}
            onChange={(on) => setFit("stretchedX", on)}
          />
          <Switches
            label="Fit canvas (Y)"
            checked={stretchedY}
            onChange={(on) => setFit("stretchedY", on)}
          />
        </Box>
        <DropArea />
        <Button
          variant="outlined"
          onClick={() => withSketch((sketch) => sketch.removeBackgroundImage())}>
          Remove image
        </Button>
      </Section>
      <Divider />
      <Section title="View" chip={`${view.zoom.toFixed(2)}x`}>
        <Typography variant="body2" color="text.secondary">
          Two fingers on the canvas zoom and pan its view. The drawing is not
          changed: the view is not saved, not an undo step, and not in the download.
          The zoom percentage of the bottom bar also takes back the zoom in and zoom
          out buttons.
        </Typography>
        <Switches
          label="Pinch zoom"
          checked={pinchZoom}
          onChange={(checked) => (CONFIG.pinchZoom = checked)}
        />
        <LabeledSlider
          label="Smallest zoom"
          value={minZoom}
          min={0.1}
          max={1}
          step={0.05}
          disabled={!pinchZoom}
          onChange={(value) => (CONFIG.minZoom = value)}
        />
        <LabeledSlider
          label="Largest zoom"
          value={maxZoom}
          min={1}
          max={20}
          step={0.5}
          disabled={!pinchZoom}
          onChange={(value) => (CONFIG.maxZoom = value)}
        />
        <Typography variant="body2" component="p" aria-live="polite">
          onViewChange: zoom {view.zoom.toFixed(2)}, x {Math.round(view.x)}, y{" "}
          {Math.round(view.y)}
        </Typography>
        <Stack>
          <Switches
            label="Show a grid (not in the drawing)"
            checked={grid}
            onChange={(checked) => (CONFIG.grid = checked)}
          />
        </Stack>
      </Section>
    </Box>
  );
});

export default CanvasTab;
