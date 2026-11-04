import { useState } from "react";
import type { ReactElement } from "react";
import CollectionsIcon from "@mui/icons-material/Collections";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { selectScenario } from "../actions";
import { SCENARIOS, scenarioInfo } from "../scenarios";
import { CONFIG } from "../stores/config";
import Island from "./Island";

/**
 * The scenario in use, with the menu to pick another, the saved drawings, and the
 * settings panel
 */
const TopRight = observer((): ReactElement => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { scenario, drawings, settingsOpen } = CONFIG;

  return (
    <Island sx={{ display: "flex", alignItems: "center", p: 0.5, gap: 0.5 }}>
      <Button
        color="inherit"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        endIcon={<ExpandMoreIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ textTransform: "none", whiteSpace: "nowrap", maxWidth: 190 }}>
        {scenarioInfo(scenario).label}
      </Button>
      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 260 } } }}>
        {SCENARIOS.map(({ value, label, summary }) => (
          <MenuItem
            key={value}
            role="menuitemradio"
            aria-checked={scenario === value}
            selected={scenario === value}
            onClick={() => {
              setAnchor(null);
              if (scenario !== value) selectScenario(value);
              // Each scenario has its own controls
              CONFIG.settingsTab = "scenario";
            }}>
            <ListItemText primary={label} secondary={summary} />
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title="Saved drawings">
        <IconButton
          aria-label={`Saved drawings (${drawings.length})`}
          onClick={() => (CONFIG.drawingsOpen = true)}>
          <Badge color="primary" badgeContent={drawings.length}>
            <CollectionsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Settings">
        <IconButton
          aria-label="Settings"
          aria-pressed={settingsOpen}
          color={settingsOpen ? "primary" : "default"}
          onClick={() => (CONFIG.settingsOpen = !settingsOpen)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </Island>
  );
});

export default TopRight;
