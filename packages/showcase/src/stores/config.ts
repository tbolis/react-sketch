import { Types } from "react-sketch";
import { makeAutoObservable, observableRef } from "mobx";
import sampleImage from "../assets/sample.png";

/**
 * The usage scenarios of the component, each one is shown in its own tab
 */
export type Scenario =
  | "playground"
  | "default-value"
  | "controlled-value"
  | "add-img"
  | "background-image";

/** The view of a canvas which was not zoomed nor panned */
export const INITIAL_VIEW: Types.SketchView = { zoom: 1, x: 0, y: 0 };

export interface Config {
  scenario: Scenario;
  selectedTool: Types.Tool | string;
  lineColor: string;
  lineWidth: number;
  lineStyle: Types.LineStyle;
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
  drawings: Drawing[];
  /** A message for the user, shown for a moment. Empty when there is none */
  notice: string;
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
  public drawings: Drawing[] = [];
  public notice = "";

  constructor() {
    // The controlled value is handed to the canvas as is, do not wrap it in a proxy
    makeAutoObservable(this, { controlledValue: observableRef });
  }
}

export const CONFIG: Config = new ConfigStore();
export default CONFIG;
