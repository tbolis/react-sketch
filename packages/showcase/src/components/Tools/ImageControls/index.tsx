import type { ReactElement } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { CONFIG, type Config } from "../../../stores/config";
import { withSketch } from "../../Canvas/sketchRef";
import Section from "../Section";

const ImageControls = ({ imageUrl }: Pick<Config, "imageUrl">): ReactElement => {
  const addImage = () => withSketch((sketch) => sketch.addImg(CONFIG.imageUrl));

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
        <Button variant="outlined" onClick={addImage}>
          Load Image from URL
        </Button>
      </Stack>
    </Section>
  );
};

export default ImageControls;
