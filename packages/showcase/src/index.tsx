import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configure } from "mobx";
import { App } from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import ShowcaseTheme from "./theme";

configure({
  enforceActions: "never",
});

const container = document.getElementById("container");
if (!container) {
  throw new Error("Missing #container element");
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <ShowcaseTheme>
        <App />
      </ShowcaseTheme>
    </ErrorBoundary>
  </StrictMode>
);
