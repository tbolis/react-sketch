import type { ReactElement, ReactNode } from "react";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { redo, undo } from "../actions";
import { CONFIG } from "../stores/config";
import Island from "./Island";

interface ActionProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Action = ({ label, disabled, onClick, children }: ActionProps) => (
  <Tooltip title={label}>
    <span>
      <IconButton
        aria-label={label}
        color="primary"
        disabled={disabled}
        onClick={onClick}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

/**
 * Undo and redo, next to the menu where they are always in sight. They are in the
 * color of the page while there is a step to go to, and fade when there is none.
 */
const History = observer((): ReactElement => {
  const { canUndo, canRedo } = CONFIG;

  return (
    <Island
      role="group"
      aria-label="History"
      sx={{ display: "flex", alignItems: "center", p: 0.5 }}>
      <Action label="Undo (Ctrl Z)" disabled={!canUndo} onClick={undo}>
        <UndoIcon />
      </Action>
      <Action label="Redo (Ctrl Shift Z)" disabled={!canRedo} onClick={redo}>
        <RedoIcon />
      </Action>
    </Island>
  );
});

export default History;
