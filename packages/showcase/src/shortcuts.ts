import { useEffect } from "react";
import {
  copy,
  openShortcuts,
  paste,
  redo,
  removeSelected,
  resetView,
  save,
  selectTool,
  undo,
  zoomBy,
} from "./actions";
import { CONFIG } from "./stores/config";
import { TOOLS, toolDigit } from "./tools";

export interface Shortcut {
  keys: string;
  description: string;
}

/** The shortcuts, as the dialog lists them. The tool keys are listed by the toolbar */
export const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "Tools",
    items: [
      { keys: "1 - 9", description: "Select a tool, in the order of the toolbar" },
      ...TOOLS.map((tool) => ({
        keys: [tool.key.toUpperCase(), toolDigit(tool)].filter(Boolean).join(" or "),
        description: tool.label,
      })),
    ],
  },
  {
    group: "Edit",
    items: [
      { keys: "Ctrl Z", description: "Undo" },
      { keys: "Ctrl Shift Z", description: "Redo" },
      { keys: "Ctrl C", description: "Copy the selected objects" },
      { keys: "Ctrl V", description: "Paste" },
      { keys: "Delete", description: "Delete the selected objects" },
      { keys: "Ctrl S", description: "Save the drawing" },
    ],
  },
  {
    group: "View",
    items: [
      { keys: "+", description: "Zoom in" },
      { keys: "-", description: "Zoom out" },
      { keys: "0", description: "Reset the zoom and the view" },
      { keys: "?", description: "Show the keyboard shortcuts" },
    ],
  },
];

/** The keys which select a tool: its letter, and its digit */
const TOOL_KEYS = new Map<string, string>(
  TOOLS.flatMap((tool) => {
    const digit = toolDigit(tool);
    const keys: [string, string][] = [[tool.key, tool.value]];
    if (digit) keys.push([digit, tool.value]);
    return keys;
  })
);

/** Whether the key is for something which takes text, as the text field or the text of the canvas */
const isTyping = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
};

const ZOOM_STEP = 1.25;

/**
 * Run the action of a key. Returns whether the key was one, so that its default is
 * prevented only then.
 */
export const runShortcut = (event: KeyboardEvent): boolean => {
  const key = event.key.toLowerCase();
  const command = event.ctrlKey || event.metaKey;

  if (command) {
    switch (key) {
      case "z":
        (event.shiftKey ? redo : undo)();
        return true;
      case "y":
        redo();
        return true;
      case "c":
        // Leave the copy of a text selection to the browser
        if (!CONFIG.hasSelection) return false;
        copy();
        return true;
      case "v":
        if (!CONFIG.canPaste) return false;
        paste();
        return true;
      case "s":
        save();
        return true;
      default:
        return false;
    }
  }
  if (event.altKey) return false;

  switch (key) {
    case "delete":
    case "backspace":
      if (!CONFIG.hasSelection) return false;
      removeSelected();
      return true;
    case "+":
    case "=":
      zoomBy(ZOOM_STEP);
      return true;
    case "-":
    case "_":
      zoomBy(1 / ZOOM_STEP);
      return true;
    case "0":
      resetView();
      return true;
    case "?":
      openShortcuts();
      return true;
    default: {
      const tool = TOOL_KEYS.get(key);
      if (!tool) return false;
      selectTool(tool);
      return true;
    }
  }
};

/**
 * Handle the keyboard shortcuts of the page. Keys typed in a text field, or in a text
 * of the canvas, are not shortcuts, and neither is a key while a dialog or a menu is open.
 */
export const useShortcuts = (): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (isTyping(event.target)) return;
      if (document.querySelector("[role='dialog'], [role='menu']")) return;
      if (runShortcut(event)) event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
};
