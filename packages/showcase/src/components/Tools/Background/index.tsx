import { useState } from "react";
import type { DragEvent, ReactElement } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { CONFIG, type Config } from "../../../stores/config";
import { readAsDataUrl } from "../../../utils/files";
import { withSketch } from "../../Canvas/api";
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

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
} as const;

/**
 * Use the first image of the files as the background of the canvas
 */
const setBackgroundImage = async (files: FileList | null): Promise<void> => {
  const image = Array.from(files ?? []).find((file) =>
    file.type.startsWith("image/")
  );
  if (image) {
    const dataUrl = await readAsDataUrl(image);
    const { stretched, stretchedX, stretchedY } = CONFIG;
    // TODO(part2): setBackgroundFromDataUrl is wired to the library ref API
    withSketch((sketch) =>
      sketch.setBackgroundFromDataUrl(dataUrl, {
        stretched,
        stretchedX,
        stretchedY,
        originX: "left",
        originY: "top",
      })
    );
  }
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
            onChange={(event) => (CONFIG.stretched = event.target.checked)}
          />
        }
      />
      <FormControlLabel
        label="Fit canvas (X)"
        control={
          <Switch
            checked={props.stretchedX}
            onChange={(event) => (CONFIG.stretchedX = event.target.checked)}
          />
        }
      />
      <FormControlLabel
        label="Fit canvas (Y)"
        control={
          <Switch
            checked={props.stretchedY}
            onChange={(event) => (CONFIG.stretchedY = event.target.checked)}
          />
        }
      />
      <DropArea />
    </Section>
  );
};

export default Background;
