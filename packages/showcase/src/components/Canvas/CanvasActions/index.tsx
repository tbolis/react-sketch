import type { ReactElement, ReactNode } from "react";
import { Types } from "react-sketch";
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
import { CONFIG, type Config } from "../../../stores/config";
import { downloadText, downloadUrl } from "../../../utils/files";
import { syncHistory, withSketch } from "../api";

type CanvasActionsProps = Pick<Config, "canUndo" | "canRedo" | "selectedTool">;

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

// TODO(part2): all the handlers below call the library ref API through withSketch
const undo = () =>
  withSketch((sketch) => {
    sketch.undo();
    syncHistory(sketch);
  });

const redo = () =>
  withSketch((sketch) => {
    sketch.redo();
    syncHistory(sketch);
  });

const clear = () =>
  withSketch((sketch) => {
    sketch.clear();
    sketch.setBackgroundFromDataUrl("");
    CONFIG.controlledValue = undefined;
    CONFIG.fillWithBackgroundColor = false;
    syncHistory(sketch);
  });

const save = () =>
  withSketch((sketch) => {
    CONFIG.drawings = [...CONFIG.drawings, sketch.toDataURL()];
  });

const download = () =>
  withSketch((sketch) => {
    downloadUrl(sketch.toDataURL(), "toPNG.png");
    downloadText(JSON.stringify(sketch.toJSON()), "toDataJSON.json");
  });

const CanvasActions = ({
  canUndo,
  canRedo,
  selectedTool,
}: CanvasActionsProps): ReactElement => {
  // Copy, paste and remove act on the selection, which is made with the select tool
  const selecting = selectedTool === Types.Tool.SELECT;

  return (
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
        <Action
          label="Copy selected"
          disabled={!selecting}
          onClick={() => withSketch((s) => s.copy())}>
          <CopyIcon />
        </Action>
        <Action
          label="Paste"
          disabled={!selecting}
          onClick={() => withSketch((s) => s.paste())}>
          <PasteIcon />
        </Action>
        <Action
          label="Delete selected"
          disabled={!selecting}
          onClick={() => withSketch((s) => s.removeSelected())}>
          <RemoveSelectedIcon />
        </Action>
      </Stack>
      <Stack direction="row">
        <Action label="Zoom in" onClick={() => withSketch((s) => s.zoom(1.25))}>
          <ZoomInIcon />
        </Action>
        <Action label="Zoom out" onClick={() => withSketch((s) => s.zoom(0.8))}>
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
};

export default CanvasActions;
