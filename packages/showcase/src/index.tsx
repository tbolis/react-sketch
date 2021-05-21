import { App } from "./App";
import * as React from "react";
import { configure } from "mobx";
import * as ReactDOM from "react-dom";
import { observer } from "mobx-react-lite";
import { createContext, useContext } from "react";
import { Config, CONFIG } from "./stores/config";

configure({
  enforceActions: "never",
});

const ShowcaseContext = createContext<Config>(CONFIG);

const AppView = observer(() => {
  const options = useContext(ShowcaseContext);
  return <App {...options} />;
});

ReactDOM.render(
  <ShowcaseContext.Provider value={CONFIG}>
    <AppView />
  </ShowcaseContext.Provider>,
  document.getElementById("container")
);
