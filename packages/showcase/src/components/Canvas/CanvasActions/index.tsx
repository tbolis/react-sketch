import type { ReactElement, ReactNode } from "react";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import CopyIcon from "@mui/icons-material/ContentCopy";
import PasteIcon from "@mui/icons-material/ContentPaste";
import RemoveSelectedIcon from "@mui/icons-material/Delete";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import ClearIcon from "@mui/icons-material/DeleteSweep";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { CONFIG, createDrawing, type Config } from "../../../stores/config";
import { downloadText, downloadUrl } from "../../../utils/files";
import { syncState, withSketch } from "../sketchRef";

type CanvasActionsProps = Pick<
  Config,
  "canUndo" | "canRedo" | "hasSelection" | "canPaste"
>;

interface ActionProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Action = ({
  label,
  disabled,
  onClick,
  children,
}: ActionProps): ReactElement => (
  <IconButton
    color="primary"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}>
    {children}
  </IconButton>
);

// Undo and redo are followed by the onChange of the canvas, which updates the state
const undo = () => withSketch((sketch) => sketch.undo());

const redo = () => withSketch((sketch) => sketch.redo());

const clear = () => {
  // Clearing also drops the background image
  withSketch((sketch) => sketch.clear());
  CONFIG.controlledValue = undefined;
  CONFIG.fillWithBackgroundColor = false;
  // The canvas does not announce it
  syncState();
};

const copy = () =>
  withSketch((sketch) => {
    sketch.copy();
    CONFIG.canPaste = true;
  });

const save = () =>
  withSketch((sketch) => {
    CONFIG.drawings = [...CONFIG.drawings, createDrawing(sketch.toDataURL())];
  });

const download = () =>
  withSketch((sketch) => {
    downloadUrl(sketch.toDataURL(), "toPNG.png");
    downloadText(JSON.stringify(sketch.toJSON()), "toDataJSON.json");
  });

const CanvasActions = ({
  canUndo,
  canRedo,
  hasSelection,
  canPaste,
}: CanvasActionsProps): ReactElement => (
  <Stack
    direction="row"
    divider={<Divider orientation="vertical" flexItem />}
    sx={{ flexWrap: "wrap", mb: 1 }}>
    <Stack direction="row">
      <Action label="Undo" disabled={!canUndo} onClick={undo}>
        <UndoIcon />
      </Action>
      <Action label="Redo" disabled={!canRedo} onClick={redo}>
        <RedoIcon />
      </Action>
    </Stack>
    <Stack direction="row">
      <Action label="Copy selected" disabled={!hasSelection} onClick={copy}>
        <CopyIcon />
      </Action>
      {/* The copy stays available, even when the selection is gone */}
      <Action
        label="Paste"
        disabled={!canPaste}
        onClick={() => withSketch((sketch) => sketch.paste())}>
        <PasteIcon />
      </Action>
      <Action
        label="Delete selected"
        disabled={!hasSelection}
        onClick={() => withSketch((sketch) => sketch.removeSelected())}>
        <RemoveSelectedIcon />
      </Action>
    </Stack>
    <Stack direction="row">
      <Action
        label="Zoom in"
        onClick={() => withSketch((sketch) => sketch.zoom(1.25))}>
        <ZoomInIcon />
      </Action>
      <Action
        label="Zoom out"
        onClick={() => withSketch((sketch) => sketch.zoom(0.8))}>
        <ZoomOutIcon />
      </Action>
    </Stack>
    <Stack direction="row">
      <Action label="Save drawing" onClick={save}>
        <SaveIcon />
      </Action>
      <Action label="Download" onClick={download}>
        <DownloadIcon />
      </Action>
      <Action label="Clear canvas" onClick={clear}>
        <ClearIcon />
      </Action>
    </Stack>
  </Stack>
);

export default CanvasActions;
