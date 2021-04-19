import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { makeAutoObservable, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { createContext, useContext } from "react";
import { configure } from "mobx";

configure({
  enforceActions: "never",
});

export class ConfigOptions {
  selectedTool = "pencil";

  constructor() {
    makeAutoObservable(this);
  }
}

const options = new ConfigOptions();
const ShowcaseContext = createContext<ConfigOptions>(options);

const AppView = observer(() => {
  const options = useContext(ShowcaseContext);
  return <App selectedTool={options.selectedTool} />;
});

setInterval(() => {
  console.error(`${options.selectedTool}`);
  options.selectedTool = options.selectedTool + " pencil";
}, 1000);

ReactDOM.render(
  <ShowcaseContext.Provider value={options}>
    <AppView />
  </ShowcaseContext.Provider>,
  document.getElementById("container")
);
