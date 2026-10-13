import type { ReactElement } from "react";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { CONFIG, type Config } from "../../../stores/config";
import { withSketch } from "../../Canvas/api";
import Section from "../Section";

const TextControls = ({ text }: Pick<Config, "text">): ReactElement => {
  // TODO(part2): addText is wired to the library ref API
  const addText = () => withSketch((sketch) => sketch.addText(CONFIG.text));

  return (
    <Section id="text" title="Text">
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <TextField
          fullWidth
          size="small"
          label="Text"
          helperText="Add text to Sketch"
          value={text}
          onChange={(event) => (CONFIG.text = event.target.value)}
        />
        <IconButton color="primary" aria-label="Add text" onClick={addText}>
          <AddIcon />
        </IconButton>
      </Stack>
    </Section>
  );
};

export default TextControls;
