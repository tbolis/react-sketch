import type { ReactElement } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { resetView, zoomBy } from "../actions";
import { CONFIG } from "../stores/config";
import Island from "./Island";

/** What the zoom in and zoom out buttons scale the drawing by */
const ZOOM_STEP = 1.25;

/**
 * The zoom: the buttons, and what the fingers zoomed, as a percentage which resets
 * the view
 */
const ZoomBar = observer((): ReactElement => {
  const { view, zoomFactor } = CONFIG;
  const zoom = Math.round(view.zoom * zoomFactor * 100);

  return (
    <Island sx={{ display: "flex", alignItems: "center", p: 0.5 }}>
      <Tooltip title="Zoom out (-)">
        <IconButton aria-label="Zoom out (-)" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          <RemoveIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset the zoom and the view (0)">
        <Button
          color="inherit"
          aria-label={`Zoom ${zoom}%, reset the zoom and the view`}
          onClick={resetView}
          sx={{ minWidth: 60, fontVariantNumeric: "tabular-nums" }}>
          {zoom}%
        </Button>
      </Tooltip>
      <Tooltip title="Zoom in (+)">
        <IconButton aria-label="Zoom in (+)" onClick={() => zoomBy(ZOOM_STEP)}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Island>
  );
});

export default ZoomBar;
