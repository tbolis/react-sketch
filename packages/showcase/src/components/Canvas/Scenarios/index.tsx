import type { ReactElement } from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import controlledValue from "../../../data/controlledValue";
import imageDataUrl from "../../../data/imageDataUrl";
import { CONFIG, type Config, type Scenario } from "../../../stores/config";
import { withSketch } from "../sketchRef";

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "playground", label: "Playground" },
  { value: "default-value", label: "defaultValue" },
  { value: "controlled-value", label: "value + forceValue" },
  { value: "add-img", label: "addImg" },
];

const selectScenario = (scenario: Scenario) => {
  CONFIG.scenario = scenario;
  // Every scenario starts on a fresh canvas
  CONFIG.controlledValue = undefined;
  // The canvas is mounted again, with no history, selection nor copy
  CONFIG.canUndo = false;
  CONFIG.canRedo = false;
  CONFIG.hasSelection = false;
  CONFIG.canPaste = false;
};

const ScenarioTabs = ({ scenario }: Pick<Config, "scenario">): ReactElement => (
  <Tabs
    value={scenario}
    variant="scrollable"
    sx={{ mb: 1 }}
    onChange={(event, value: Scenario) => selectScenario(value)}>
    {SCENARIOS.map(({ value, label }) => (
      <Tab key={value} value={value} label={label} />
    ))}
  </Tabs>
);

/**
 * The description and the actions of the selected scenario
 */
const ScenarioControls = ({
  scenario,
  forceValue,
}: Pick<Config, "scenario" | "forceValue">): ReactElement => {
  switch (scenario) {
    case "default-value":
      return (
        <Typography variant="body2" sx={{ mb: 1 }}>
          The canvas starts with the drawing of defaultValue
          (src/data/defaultValue.ts). Later changes of the drawing are kept.
        </Typography>
      );
    case "controlled-value":
      return (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The drawing is controlled by the value prop
            (src/data/controlledValue.ts). With forceValue the value is loaded again
            on every update of the canvas properties, even when it did not change, so
            changing for example the line weight discards the drawing.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
            <Button
              variant="outlined"
              // A new object, so that the canvas reloads the value on every click
              onClick={() => (CONFIG.controlledValue = { ...controlledValue })}>
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
          </Stack>
        </>
      );
    case "add-img":
      return (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Add an image to the drawing from a data URL (src/data/imageDataUrl.ts).
            To add an image from a URL use the Images section of the tools.
          </Typography>
          <Button
            variant="outlined"
            sx={{ mb: 1 }}
            onClick={() => withSketch((sketch) => sketch.addImg(imageDataUrl))}>
            Load Image from Data URL
          </Button>
        </>
      );
    default:
      return (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Draw with the tools of the panel, no initial value.
        </Typography>
      );
  }
};

export { ScenarioTabs, ScenarioControls };
