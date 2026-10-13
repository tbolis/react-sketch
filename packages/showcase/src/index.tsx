import { App } from "./App";
import { createRoot } from "react-dom/client";
import { configure } from "mobx";
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

const container = document.getElementById("container");
if (!container) {
  throw new Error("Missing #container element");
}

createRoot(container).render(
  <ShowcaseContext.Provider value={CONFIG}>
    <AppView />
  </ShowcaseContext.Provider>
);
