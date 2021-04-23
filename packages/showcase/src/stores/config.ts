import { Types } from "react-sketch";
import { makeAutoObservable } from "mobx";

export interface Config {
  selectedTool: Types.Tool | string;
}

export class ConfigStore implements Config {
  public selectedTool = "line";

  constructor() {
    makeAutoObservable(this);
  }
}

export const CONFIG: Config = new ConfigStore();
export default CONFIG;
