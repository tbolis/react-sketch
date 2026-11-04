import type { ReactElement } from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { loadControlledValue } from "../../actions";
import imageDataUrl from "../../data/imageDataUrl";
import { scenarioInfo } from "../../scenarios";
import { withSketch } from "../../sketchRef";
import { CONFIG } from "../../stores/config";

/**
 * The description of the scenario in use, and its actions
 */
const ScenarioTab = observer((): ReactElement => {
  const { scenario, forceValue, backgroundImageUrl } = CONFIG;
  const { label, description } = scenarioInfo(scenario);

  return (
    <Stack spacing={1.5} sx={{ py: 1.5 }}>
      <Typography variant="subtitle1" component="h3">
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      {scenario === "controlled-value" && (
        <>
          <Button variant="outlined" onClick={loadControlledValue}>
            Load controlled Value
          </Button>
          <FormControlLabel
            label="forceValue"
            control={
              <Switch
                checked={forceValue}
                onChange={(event) => (CONFIG.forceValue = event.target.checked)}
              />
            }
          />
        </>
      )}
      {scenario === "add-img" && (
        <Button
          variant="outlined"
          onClick={() => withSketch((sketch) => sketch.addImg(imageDataUrl))}>
          Load Image from Data URL
        </Button>
      )}
      {scenario === "background-image" && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            label="backgroundImage"
            value={backgroundImageUrl}
            onChange={(event) => (CONFIG.backgroundImageUrl = event.target.value)}
          />
          <Button
            variant="outlined"
            sx={{ flexShrink: 0 }}
            onClick={() => (CONFIG.backgroundImageUrl = "")}>
            Remove
          </Button>
        </Stack>
      )}
    </Stack>
  );
});

export default ScenarioTab;
