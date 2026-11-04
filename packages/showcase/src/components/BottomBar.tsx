import type { ReactElement, ReactNode } from "react";
import RedoIcon from "@mui/icons-material/Redo";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import UndoIcon from "@mui/icons-material/Undo";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { redo, resetView, undo, zoomBy } from "../actions";
import { CONFIG } from "../stores/config";
import Island from "./Island";

interface ActionProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Action = ({ label, disabled, onClick, children }: ActionProps) => (
  <Tooltip title={label}>
    <span>
      <IconButton aria-label={label} disabled={disabled} onClick={onClick}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

/** What the zoom in and zoom out buttons scale the drawing by */
const ZOOM_STEP = 1.25;

/**
 * Undo and redo, and the zoom: the buttons, and what the fingers zoomed, as a
 * percentage which resets the view
 */
const BottomBar = observer((): ReactElement => {
  const { canUndo, canRedo, view, zoomFactor } = CONFIG;
  const zoom = Math.round(view.zoom * zoomFactor * 100);

  return (
    <>
      <Island sx={{ display: "flex", alignItems: "center", p: 0.5 }}>
        <Action label="Zoom out (-)" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          <RemoveIcon />
        </Action>
        <Tooltip title="Reset the zoom and the view (0)">
          <Button
            color="inherit"
            aria-label={`Zoom ${zoom}%, reset the zoom and the view`}
            onClick={resetView}
            sx={{ minWidth: 60, fontVariantNumeric: "tabular-nums" }}>
            {zoom}%
          </Button>
        </Tooltip>
        <Action label="Zoom in (+)" onClick={() => zoomBy(ZOOM_STEP)}>
          <AddIcon />
        </Action>
      </Island>
      <Island sx={{ display: "flex", alignItems: "center", p: 0.5 }}>
        <Action label="Undo (Ctrl Z)" disabled={!canUndo} onClick={undo}>
          <UndoIcon />
        </Action>
        <Action label="Redo (Ctrl Shift Z)" disabled={!canRedo} onClick={redo}>
          <RedoIcon />
        </Action>
      </Island>
    </>
  );
});

export default BottomBar;
