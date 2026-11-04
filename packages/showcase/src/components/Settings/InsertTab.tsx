import type { ChangeEvent, ReactElement } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import outlineDataUrl from "../../data/outlineDataUrl";
import { withSketch } from "../../sketchRef";
import { CONFIG } from "../../stores/config";
import { readAsDataUrl } from "../../utils/files";
import { visuallyHidden } from "./CanvasTab";
import Section from "./Section";

const addText = () =>
  withSketch((sketch) => sketch.addText(CONFIG.text, { fill: CONFIG.lineColor }));

const addImage = () =>
  withSketch((sketch) =>
    sketch.addImg(CONFIG.imageUrl, {
      crossOrigin: CONFIG.imageCors ? "anonymous" : undefined,
    })
  );

/**
 * Use the image as the overlay of the canvas, above the drawing. It fills the canvas,
 * as an outline to draw within does.
 */
const setOverlay = (dataUrl: string): void =>
  withSketch((sketch) => sketch.setOverlayFromDataUrl(dataUrl, { stretched: true }));

const chooseImage = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
  const image = Array.from(event.target.files ?? []).find((file) =>
    file.type.startsWith("image/")
  );
  // The same file can be chosen again
  event.target.value = "";
  if (image) setOverlay(await readAsDataUrl(image));
};

/**
 * What to put on the canvas: text, an image from a URL, and an overlay
 */
const InsertTab = observer((): ReactElement => {
  const { text, imageUrl, imageCors } = CONFIG;

  return (
    <Box>
      <Section title="Text">
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <TextField
            fullWidth
            size="small"
            label="Text"
            helperText="Add text to Sketch"
            value={text}
            onChange={(event) => (CONFIG.text = event.target.value)}
          />
          <Tooltip title="Add text">
            <IconButton color="primary" aria-label="Add text" onClick={addText}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Section>
      <Divider />
      <Section title="Images">
        <TextField
          fullWidth
          size="small"
          label="Image URL"
          helperText="Copy/Paste an image URL"
          value={imageUrl}
          onChange={(event) => (CONFIG.imageUrl = event.target.value)}
        />
        <FormControlLabel
          label="Request with CORS (crossOrigin)"
          control={
            <Switch
              checked={imageCors}
              onChange={(event) => (CONFIG.imageCors = event.target.checked)}
            />
          }
        />
        <Button variant="outlined" onClick={addImage}>
          Load Image from URL
        </Button>
      </Section>
      <Divider />
      <Section title="Overlay">
        <Typography variant="body2" color="text.secondary">
          An image drawn above the drawing, for example an outline to draw within. It
          takes no mouse events, and the download includes it.
        </Typography>
        <Button variant="outlined" onClick={() => setOverlay(outlineDataUrl)}>
          Use the sample outline
        </Button>
        <Button variant="outlined" component="label">
          Choose an image
          <Box
            component="input"
            type="file"
            accept="image/*"
            sx={visuallyHidden}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              void chooseImage(event)
            }
          />
        </Button>
        <Button
          variant="outlined"
          onClick={() => withSketch((sketch) => sketch.removeOverlayImage())}>
          Remove overlay
        </Button>
      </Section>
    </Box>
  );
});

export default InsertTab;
