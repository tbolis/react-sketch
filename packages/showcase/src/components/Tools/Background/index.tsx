import { useState } from "react";
import type { DragEvent, ReactElement } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { CONFIG, type Config } from "../../../stores/config";
import { readAsDataUrl } from "../../../utils/files";
import { withSketch } from "../../Canvas/sketchRef";
import ColorField from "../ColorField";
import Section from "../Section";

type BackgroundProps = Pick<
  Config,
  | "fillWithBackgroundColor"
  | "backgroundColor"
  | "stretched"
  | "stretchedX"
  | "stretchedY"
>;

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
        p: 2,
        textAlign: "center",
        cursor: "pointer",
        border: "2px dashed",
        borderStyle: active ? "solid" : "dashed",
        borderColor: active ? "primary.main" : "text.disabled",
        borderRadius: 1,
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

const Background = (props: BackgroundProps): ReactElement => {
  return (
    <Section
      id="background"
      title="Background"
      chip={props.fillWithBackgroundColor ? props.backgroundColor : "none"}>
      <FormControlLabel
        label="Background Color"
        control={
          <Switch
            checked={props.fillWithBackgroundColor}
            onChange={(event) =>
              (CONFIG.fillWithBackgroundColor = event.target.checked)
            }
          />
        }
      />
      <ColorField
        label="Color"
        value={props.backgroundColor}
        disabled={!props.fillWithBackgroundColor}
        onChange={(color) => (CONFIG.backgroundColor = color)}
      />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Set Image Background
      </Typography>
      <FormControlLabel
        label="Fit canvas (X,Y)"
        control={
          <Switch
            checked={props.stretched}
            onChange={(event) => setFit("stretched", event.target.checked)}
          />
        }
      />
      <FormControlLabel
        label="Fit canvas (X)"
        control={
          <Switch
            checked={props.stretchedX}
            onChange={(event) => setFit("stretchedX", event.target.checked)}
          />
        }
      />
      <FormControlLabel
        label="Fit canvas (Y)"
        control={
          <Switch
            checked={props.stretchedY}
            onChange={(event) => setFit("stretchedY", event.target.checked)}
          />
        }
      />
      <DropArea />
      <Button
        variant="outlined"
        sx={{ mt: 1 }}
        onClick={() => withSketch((sketch) => sketch.removeBackgroundImage())}>
        Remove image
      </Button>
    </Section>
  );
};

export default Background;
