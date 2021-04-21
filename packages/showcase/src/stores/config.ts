import { makeAutoObservable } from "mobx";

export interface Config {
  selectedTool: string;
}

export class ConfigStore implements Config {
  public selectedTool = "pencil";

  constructor() {
    makeAutoObservable(this);
  }
}

export const CONFIG: Config = new ConfigStore();

export default CONFIG;
