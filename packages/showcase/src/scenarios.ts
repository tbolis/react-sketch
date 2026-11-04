import type { Scenario } from "./stores/config";

export interface ScenarioInfo {
  value: Scenario;
  /** The name of the property or the method of the component the scenario is about */
  label: string;
  /** What the scenario shows, in a line */
  summary: string;
  description: string;
}

export const SCENARIOS: ScenarioInfo[] = [
  {
    value: "playground",
    label: "Playground",
    summary: "An empty canvas",
    description: "Draw with the tools of the toolbar, there is no initial value.",
  },
  {
    value: "default-value",
    label: "defaultValue",
    summary: "Starts with a drawing",
    description:
      "The canvas starts with the drawing of defaultValue (src/data/defaultValue.ts). Later changes of the drawing are kept.",
  },
  {
    value: "controlled-value",
    label: "value + forceValue",
    summary: "The drawing is a property",
    description:
      "The drawing is controlled by the value prop (src/data/controlledValue.ts). With forceValue the value is loaded again on every update of the canvas properties, even when it did not change, so changing for example the line weight discards the drawing.",
  },
  {
    value: "add-img",
    label: "addImg",
    summary: "Add an image from a data URL",
    description:
      "Add an image to the drawing from a data URL (src/data/imageDataUrl.ts). To add an image from a URL use the Insert tab.",
  },
  {
    value: "background-image",
    label: "backgroundImage",
    summary: "A background image from a URL",
    description:
      "The background image comes from the backgroundImage property, with the fit switches of the Canvas tab as backgroundImageOptions. The canvas sets it when the URL changes, and removes it when the URL is empty.",
  },
];

export const scenarioInfo = (scenario: Scenario): ScenarioInfo =>
  SCENARIOS.find(({ value }) => value === scenario) ?? SCENARIOS[0];
