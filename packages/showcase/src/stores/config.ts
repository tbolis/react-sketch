import { Types } from "react-sketch";
import { makeAutoObservable, observableRef } from "mobx";
import sampleImage from "../assets/sample.png";

/**
 * The usage scenarios of the component, each one is a canvas of its own
 */
export type Scenario =
  | "playground"
  | "default-value"
  | "controlled-value"
  | "add-img"
  | "background-image";

/** The tabs of the settings panel */
export type SettingsTab = "scenario" | "canvas" | "insert";

/** The panels which float over the canvas and can be moved */
export type PanelId = "toolbar" | "properties" | "preview" | "settings";

/** How far a panel is from its place in the layout, in pixels */
export interface Offset {
  x: number;
  y: number;
}

export const NO_OFFSET: Offset = { x: 0, y: 0 };

/** Every panel in its place */
export const PANELS_IN_PLACE = (): Record<PanelId, Offset> => ({
  toolbar: NO_OFFSET,
  properties: NO_OFFSET,
  preview: NO_OFFSET,
  settings: NO_OFFSET,
});

/** The view of a canvas which was not zoomed nor panned */
export const INITIAL_VIEW: Types.SketchView = { zoom: 1, x: 0, y: 0 };

/** The width of the screen from which the panels float next to the canvas */
export const DESKTOP_QUERY = "(min-width: 900px)";

const isDesktop = (): boolean =>
  typeof window === "undefined" || window.matchMedia(DESKTOP_QUERY).matches;

export interface Size {
  width: number;
  height: number;
}

export interface Config {
  scenario: Scenario;
  selectedTool: Types.Tool | string;
  lineColor: string;
  lineWidth: number;
  lineStyle: Types.LineStyle;
  /** The strokes of a pen are as wide as the pressure on it (the pencil) */
  pressureSensitive: boolean;
  pinchZoom: boolean;
  minZoom: number;
  maxZoom: number;
  /** The view of the canvas, as it reports it */
  view: Types.SketchView;
  /** A small copy of the whole drawing, as a data URL. Empty when there is none yet */
  preview: string;
  /** What the zoom in and zoom out buttons scaled the drawing by, 1 when they did not */
  zoomFactor: number;
  fillWithColor: boolean;
  fillColor: string;
  fillWithBackgroundColor: boolean;
  backgroundColor: string;
  controlledSize: boolean;
  sketchWidth: number;
  sketchHeight: number;
  /** The size the canvas has now, the one of the window or the controlled one */
  canvasSize: Size;
  stretched: boolean;
  stretchedX: boolean;
  stretchedY: boolean;
  text: string;
  imageUrl: string;
  imageCors: boolean;
  backgroundImageUrl: string;
  controlledValue: object | undefined;
  forceValue: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  canPaste: boolean;
  /** Whether nothing is drawn on the canvas */
  empty: boolean;
  /** Show a grid behind the drawing, it is not part of the drawing */
  grid: boolean;
  drawings: Drawing[];
  /** A message for the user, shown for a moment. Empty when there is none */
  notice: string;
  /** Where the panels were moved to, from their place in the layout */
  panelOffsets: Record<PanelId, Offset>;
  /** The panel which was used last: it is above the others when they overlap */
  frontPanel: PanelId | null;
  /** The panel of the line, the colors and the style of the tools */
  propertiesOpen: boolean;
  /** The panel of the scenario, the canvas and what to insert */
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  previewOpen: boolean;
  drawingsOpen: boolean;
  shortcutsOpen: boolean;
}

/**
 * A drawing saved with the save action, as a data URL
 */
export interface Drawing {
  id: number;
  src: string;
}

let lastDrawingId = 0;

/**
 * Creates a drawing with an id that is unique in this session
 */
export const createDrawing = (src: string): Drawing => ({
  id: ++lastDrawingId,
  src,
});

export class ConfigStore implements Config {
  public scenario: Scenario = "playground";
  public selectedTool = Types.Tool.PENCIL;
  public lineColor = "#000000";
  public lineWidth = 1;
  public lineStyle: Types.LineStyle = "solid";
  public pressureSensitive = true;
  public pinchZoom = true;
  public minZoom = 0.5;
  public maxZoom = 8;
  public view: Types.SketchView = INITIAL_VIEW;
  public preview = "";
  public zoomFactor = 1;
  public fillWithColor = false;
  public fillColor = "#68ccca";
  public fillWithBackgroundColor = false;
  public backgroundColor = "#ffffff";
  public controlledSize = false;
  public sketchWidth = 600;
  public sketchHeight = 600;
  public canvasSize: Size = { width: 1000, height: 600 };
  public stretched = true;
  public stretchedX = false;
  public stretchedY = false;
  public text = "a text, cool!";
  public imageUrl = sampleImage;
  public imageCors = false;
  public backgroundImageUrl = sampleImage;
  public controlledValue: object | undefined = undefined;
  public forceValue = true;
  public canUndo = false;
  public canRedo = false;
  public hasSelection = false;
  public canPaste = false;
  public empty = true;
  public grid = false;
  public drawings: Drawing[] = [];
  public notice = "";
  public panelOffsets = PANELS_IN_PLACE();
  public frontPanel: PanelId | null = null;
  public propertiesOpen = isDesktop();
  public settingsOpen = false;
  public settingsTab: SettingsTab = "scenario";
  public previewOpen = true;
  public drawingsOpen = false;
  public shortcutsOpen = false;

  constructor() {
    // The controlled value is handed to the canvas as is, do not wrap it in a proxy
    makeAutoObservable(this, { controlledValue: observableRef });
  }
}

export const CONFIG: Config = new ConfigStore();
export default CONFIG;
