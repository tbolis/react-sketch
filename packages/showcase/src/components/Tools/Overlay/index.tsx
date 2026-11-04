import type { ChangeEvent, ReactElement } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import outlineDataUrl from "../../../data/outlineDataUrl";
import { readAsDataUrl } from "../../../utils/files";
import { withSketch } from "../../Canvas/sketchRef";
import { visuallyHidden } from "../Background";
import Section from "../Section";

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

const Overlay = (): ReactElement => (
  <Section id="overlay" title="Overlay">
    <Typography variant="body2" sx={{ mb: 1 }}>
      An image drawn above the drawing, for example an outline to draw within. It
      takes no mouse events, and the download includes it.
    </Typography>
    <Stack spacing={1}>
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
    </Stack>
  </Section>
);

export default Overlay;
