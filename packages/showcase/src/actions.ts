import { Types, type SketchField } from "react-sketch";
import controlledValue from "./data/controlledValue";
import {
  CONFIG,
  INITIAL_VIEW,
  createDrawing,
  type Scenario,
  type SettingsTab,
} from "./stores/config";
import { downloadText, downloadUrl } from "./utils/files";
import { centerScene } from "./utils/scene";
import { syncPreview, syncState, withSketch } from "./sketchRef";

/**
 * What the buttons, the menus and the keyboard shortcuts do. They change the store and
 * act on the mounted canvas, so the components stay free of that.
 */

interface LineSettings {
  lineColor: string;
  lineWidth: number;
}

/** The line of the laser pointer, a thin black one is hardly seen */
let laserLine: LineSettings = { lineColor: "#ff0000", lineWidth: 8 };
/** The line of the other tools, kept while the laser pointer is in use */
let otherLine: LineSettings = {
  lineColor: CONFIG.lineColor,
  lineWidth: CONFIG.lineWidth,
};

const swapLine = (leaving: LineSettings): LineSettings => {
  const { lineColor, lineWidth } = CONFIG;
  Object.assign(CONFIG, leaving);
  return { lineColor, lineWidth };
};

/**
 * Select the tool of the canvas. The laser pointer keeps its own color and weight,
 * apart from the other tools.
 */
export const selectTool = (tool: string): void => {
  const laser = Types.Tool.LASER_POINTER;
  if (tool === laser && CONFIG.selectedTool !== laser) {
    otherLine = swapLine(laserLine);
  } else if (tool !== laser && CONFIG.selectedTool === laser) {
    laserLine = swapLine(otherLine);
  }
  CONFIG.selectedTool = tool;
};

/** The tools which draw no line style: their line is a brush, or is not kept */
export const NO_LINE_STYLE: string[] = [
  Types.Tool.HIGHLIGHTER,
  Types.Tool.ERASER,
  Types.Tool.LASER_POINTER,
];

/** The tools which draw nothing, so their line, color and style do not matter */
export const NO_PROPERTIES: string[] = [Types.Tool.SELECT, Types.Tool.PAN];

/**
 * Start a scenario on a fresh canvas
 */
export const selectScenario = (scenario: Scenario): void => {
  CONFIG.scenario = scenario;
  CONFIG.controlledValue = undefined;
  // The canvas is mounted again, with no history, selection nor copy
  CONFIG.canUndo = false;
  CONFIG.canRedo = false;
  CONFIG.hasSelection = false;
  CONFIG.canGroup = false;
  CONFIG.canUngroup = false;
  CONFIG.canPaste = false;
  CONFIG.empty = true;
  CONFIG.view = INITIAL_VIEW;
  CONFIG.zoomFactor = 1;
  CONFIG.preview = "";
};

export const openShortcuts = (): void => {
  CONFIG.shortcutsOpen = true;
};

export const openSettings = (tab: SettingsTab): void => {
  CONFIG.settingsTab = tab;
  CONFIG.settingsOpen = true;
};

// Undo and redo are followed by the onChange of the canvas, which updates the state
export const undo = (): void => withSketch((sketch) => sketch.undo());

export const redo = (): void => withSketch((sketch) => sketch.redo());

export const clear = (): void => {
  // Clearing also drops the background image
  withSketch((sketch) => sketch.clear());
  CONFIG.controlledValue = undefined;
  CONFIG.fillWithBackgroundColor = false;
  // What was scaled is gone
  CONFIG.zoomFactor = 1;
  // The canvas does not announce it
  syncState();
  syncPreview();
};

/** The buttons scale the drawing (`zoom()`), which is not the view of the fingers */
export const zoomBy = (factor: number): void =>
  withSketch((sketch) => {
    sketch.zoom(factor);
    CONFIG.zoomFactor *= factor;
    syncPreview();
  });

/** Back to the whole canvas: what the buttons scaled, and what the fingers zoomed and panned */
export const resetView = (): void =>
  withSketch((sketch) => {
    if (CONFIG.zoomFactor !== 1) sketch.zoom(1 / CONFIG.zoomFactor);
    CONFIG.zoomFactor = 1;
    sketch.resetView();
    syncPreview();
  });

/**
 * Give the canvas the size of the background image, so the drawing is on the image pixel
 * for pixel. The canvas is a sheet of that size, which scrolls when the window is smaller.
 * The zoom is taken back first: the size is the one of the drawing, not of the view.
 */
export const restoreOriginalSize = (): void =>
  withSketch((sketch) => {
    const size = sketch.getOriginalSize();
    if (!size) {
      CONFIG.notice = "The canvas has no background image.";
      return;
    }
    resetView();
    CONFIG.sketchWidth = size.width;
    CONFIG.sketchHeight = size.height;
    CONFIG.controlledSize = true;
  });

/** The canvas announces the change, which updates the state of the actions */
export const groupSelected = (): void => withSketch((sketch) => sketch.group());

export const ungroupSelected = (): void => withSketch((sketch) => sketch.ungroup());

export const copy = (): void =>
  withSketch((sketch) => {
    if (!sketch.hasSelection()) return;
    sketch.copy();
    CONFIG.canPaste = true;
  });

/** The copy stays available, even when the selection is gone */
export const paste = (): void => {
  if (CONFIG.canPaste) withSketch((sketch) => sketch.paste());
};

export const removeSelected = (): void =>
  withSketch((sketch) => sketch.removeSelected());

/**
 * The canvas as a data URL. A canvas with an image of another site that does not allow
 * it (CORS) cannot be exported: the user is told, and there is no URL.
 */
const exportPng = (
  sketch: SketchField,
  options?: Types.DataUrlOptions
): string | undefined => {
  try {
    return sketch.toDataURL(options);
  } catch {
    CONFIG.notice =
      "The canvas cannot be exported: an image on it comes from another site that does not allow it (CORS).";
    return undefined;
  }
};

export const save = (): void =>
  withSketch((sketch) => {
    const src = exportPng(sketch);
    if (!src) return;
    CONFIG.drawings = [...CONFIG.drawings, createDrawing(src)];
    CONFIG.notice = "Drawing saved.";
  });

export const download = (): void =>
  withSketch((sketch) => {
    // The file has the resolution of the background image, whatever the size of the canvas
    const src = exportPng(sketch, { multiplier: "original" });
    if (!src) return;
    downloadUrl(src, "toPNG.png");
    downloadText(JSON.stringify(sketch.toJSON()), "toDataJSON.json");
  });

/**
 * Load the sample drawing as the controlled value, in the middle of the canvas.
 * It is a new object, so that the canvas loads it on every call.
 */
export const loadControlledValue = (): void => {
  CONFIG.controlledValue = centerScene(controlledValue, CONFIG.canvasSize);
  // The value is loaded as it is, not scaled by the buttons
  CONFIG.zoomFactor = 1;
};
