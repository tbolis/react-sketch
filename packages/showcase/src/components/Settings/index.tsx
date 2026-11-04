import type { ReactElement } from "react";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { CONFIG, type SettingsTab } from "../../stores/config";
import Island from "../Island";
import CanvasTab from "./CanvasTab";
import InsertTab from "./InsertTab";
import ScenarioTab from "./ScenarioTab";

const TABS: { value: SettingsTab; label: string }[] = [
  { value: "scenario", label: "Scenario" },
  { value: "canvas", label: "Canvas" },
  { value: "insert", label: "Insert" },
];

/**
 * The settings of the canvas, in tabs: the scenario, the canvas itself, and what to
 * insert. Hidden panels are not rendered, they have nothing to keep.
 */
const Settings = observer((): ReactElement => {
  const { settingsTab } = CONFIG;

  return (
    <Island
      component="section"
      aria-label="Settings"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={settingsTab}
          variant="fullWidth"
          aria-label="Settings sections"
          sx={{ flex: 1 }}
          onChange={(_event, value: SettingsTab) => (CONFIG.settingsTab = value)}>
          {TABS.map(({ value, label }) => (
            <Tab
              key={value}
              value={value}
              label={label}
              id={`settings-tab-${value}`}
              aria-controls={`settings-panel-${value}`}
            />
          ))}
        </Tabs>
        <Tooltip title="Close the settings">
          <IconButton
            aria-label="Close the settings"
            sx={{ mx: 0.5 }}
            onClick={() => (CONFIG.settingsOpen = false)}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <div
        role="tabpanel"
        id={`settings-panel-${settingsTab}`}
        aria-labelledby={`settings-tab-${settingsTab}`}
        style={{ overflowY: "auto", padding: "0 16px 8px", minHeight: 0 }}>
        {settingsTab === "scenario" && <ScenarioTab />}
        {settingsTab === "canvas" && <CanvasTab />}
        {settingsTab === "insert" && <InsertTab />}
      </div>
    </Island>
  );
});

export default Settings;
