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
 * Undo and redo, next to the menu where they are always in sight. They fade out
 * until the first change, and come in with it.
 */
const History = observer((): ReactElement => {
  const { canUndo, canRedo } = CONFIG;
  const active = canUndo || canRedo;

  return (
    <Island
      role="group"
      aria-label="History"
      sx={{
        display: "flex",
        alignItems: "center",
        p: 0.5,
        opacity: active ? 1 : 0.5,
        transition: "opacity 250ms",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}>
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
