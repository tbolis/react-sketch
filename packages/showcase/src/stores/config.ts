import { Types } from "react-sketch";
import { makeAutoObservable, observableRef } from "mobx";

/**
 * The usage scenarios of the component, each one is shown in its own tab
 */
export type Scenario =
  "playground" | "default-value" | "controlled-value" | "add-img";

export interface Config {
  scenario: Scenario;
  selectedTool: Types.Tool | string;
  lineColor: string;
  lineWidth: number;
  fillWithColor: boolean;
  fillColor: string;
  opacity: number;
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
  controlledValue: object | undefined;
  forceValue: boolean;
  canUndo: boolean;
  canRedo: boolean;
  drawings: string[];
}

export class ConfigStore implements Config {
  public scenario: Scenario = "playground";
  public selectedTool = "line";
  public lineColor = "#000000";
  public lineWidth = 1;
  public fillWithColor = false;
  public fillColor = "#68ccca";
  public opacity = 1;
  public fillWithBackgroundColor = false;
  public backgroundColor = "#ffffff";
  public controlledSize = false;
  public sketchWidth = 600;
  public sketchHeight = 600;
  public stretched = true;
  public stretchedX = false;
  public stretchedY = false;
  public text = "a text, cool!";
  public imageUrl = "https://files.gamebanana.com/img/ico/sprays/4ea2f4dad8d6f.png";
  public controlledValue: object | undefined = undefined;
  public forceValue = true;
  public canUndo = false;
  public canRedo = false;
  public drawings: string[] = [];

  constructor() {
    // The controlled value is handed to the canvas as is, do not wrap it in a proxy
    makeAutoObservable(this, { controlledValue: observableRef });
  }
}

export const CONFIG: Config = new ConfigStore();
export default CONFIG;
