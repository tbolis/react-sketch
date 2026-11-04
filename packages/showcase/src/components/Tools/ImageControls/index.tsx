import type { ReactElement } from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { CONFIG, type Config } from "../../../stores/config";
import { withSketch } from "../../Canvas/sketchRef";
import Section from "../Section";

const ImageControls = ({
  imageUrl,
  imageCors,
}: Pick<Config, "imageUrl" | "imageCors">): ReactElement => {
  const addImage = () =>
    withSketch((sketch) =>
      sketch.addImg(CONFIG.imageUrl, {
        crossOrigin: CONFIG.imageCors ? "anonymous" : undefined,
      })
    );

  return (
    <Section id="images" title="Images">
      <Stack spacing={1}>
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
      </Stack>
    </Section>
  );
};

export default ImageControls;
