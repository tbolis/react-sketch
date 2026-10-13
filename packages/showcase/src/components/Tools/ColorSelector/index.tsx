import type { ReactElement } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { CONFIG, type Config } from "../../../stores/config";
import ColorField from "../ColorField";
import Section from "../Section";

type ColorSelectorProps = Pick<Config, "lineColor" | "fillWithColor" | "fillColor">;

const ColorSelector = (props: ColorSelectorProps): ReactElement => {
  return (
    <Section id="colors" title="Colors" chip={props.lineColor}>
      <ColorField
        label="Line"
        value={props.lineColor}
        onChange={(color) => (CONFIG.lineColor = color)}
      />
      <FormControlLabel
        label="Fill"
        control={
          <Switch
            checked={props.fillWithColor}
            onChange={(event) => (CONFIG.fillWithColor = event.target.checked)}
          />
        }
      />
      <ColorField
        label="Fill color"
        value={props.fillColor}
        disabled={!props.fillWithColor}
        onChange={(color) => (CONFIG.fillColor = color)}
      />
    </Section>
  );
};

export default ColorSelector;
