import { Types } from "react-sketch";
import { makeAutoObservable } from "mobx";

export interface Config {
  selectedTool: Types.Tool | string;
  lineWidth: number;
}

export class ConfigStore implements Config {
  public selectedTool = "line";
  public lineWidth = 1;

  constructor() {
    makeAutoObservable(this);
  }
}

export const CONFIG: Config = new ConfigStore();
export default CONFIG;
