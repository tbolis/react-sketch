import type { ReactElement } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { CONFIG, type Config } from "../../../stores/config";
import LabeledSlider from "../LabeledSlider";
import Section from "../Section";

type ViewControlsProps = Pick<Config, "pinchZoom" | "minZoom" | "maxZoom" | "view">;

/**
 * Try the pinch zoom: the switch and the limits of the view, and the view as the
 * canvas reports it. The view is reset by the button of the canvas.
 */
const ViewControls = (props: ViewControlsProps): ReactElement => {
  const { pinchZoom, minZoom, maxZoom, view } = props;

  return (
    <Section id="view" title="View" chip={`${view.zoom.toFixed(2)}x`}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Two fingers on the canvas zoom and pan its view. The drawing is not changed:
        the view is not saved, not an undo step, and not in the download. The reset
        view button is above the canvas.
      </Typography>
      <FormControlLabel
        label="Pinch zoom"
        control={
          <Switch
            checked={pinchZoom}
            onChange={(event) => (CONFIG.pinchZoom = event.target.checked)}
          />
        }
      />
      <LabeledSlider
        label="Smallest zoom"
        value={minZoom}
        min={0.1}
        max={1}
        step={0.05}
        disabled={!pinchZoom}
        onChange={(value) => (CONFIG.minZoom = value)}
      />
      <LabeledSlider
        label="Largest zoom"
        value={maxZoom}
        min={1}
        max={20}
        step={0.5}
        disabled={!pinchZoom}
        onChange={(value) => (CONFIG.maxZoom = value)}
      />
      <Typography variant="body2" component="p" sx={{ mt: 1 }} aria-live="polite">
        onViewChange: zoom {view.zoom.toFixed(2)}, x {Math.round(view.x)}, y{" "}
        {Math.round(view.y)}
      </Typography>
    </Section>
  );
};

export default ViewControls;
