import { useState } from "react";
import type { ReactElement } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/DeleteSweep";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DownloadIcon from "@mui/icons-material/Download";
import GitHubIcon from "@mui/icons-material/GitHub";
import ImageIcon from "@mui/icons-material/AddPhotoAlternate";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import ResetIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import TuneIcon from "@mui/icons-material/Tune";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useColorScheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  clear,
  download,
  openSettings,
  openShortcuts,
  resetPanels,
  save,
} from "../actions";
import logo from "../assets/react-sketch-logo.jpg";
import Island from "./Island";

const REPOSITORY = "https://github.com/tbolis/react-sketch";

type Mode = "light" | "dark" | "system";

const MODES: { value: Mode; label: string; icon: ReactElement }[] = [
  { value: "light", label: "Light", icon: <LightModeIcon fontSize="small" /> },
  { value: "dark", label: "Dark", icon: <DarkModeIcon fontSize="small" /> },
  {
    value: "system",
    label: "System",
    icon: <SettingsBrightnessIcon fontSize="small" />,
  },
];

/**
 * The menu of the page: what to do with the drawing, the panels, the color scheme, and
 * the links
 */
const MainMenu = (): ReactElement => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { mode, setMode } = useColorScheme();
  const close = () => setAnchor(null);
  // The menu closes with every choice, except the color scheme which is tried at once
  const run = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <Island
      sx={{
        display: "flex",
        alignItems: "center",
        p: 0.5,
        pr: { xs: 0.5, sm: 1.5 },
      }}>
      <Tooltip title="Menu">
        <IconButton
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={anchor !== null}
          onClick={(event) => setAnchor(event.currentTarget)}>
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Avatar
        alt=""
        src={logo}
        sx={{ width: 28, height: 28, ml: 0.5, display: { xs: "none", sm: "flex" } }}
      />
      <Typography
        variant="subtitle2"
        component="h1"
        noWrap
        sx={{ ml: 1, display: { xs: "none", sm: "block" } }}>
        react-sketch
      </Typography>
      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        slotProps={{ paper: { sx: { minWidth: 260 } } }}>
        <ListSubheader sx={{ lineHeight: "32px", bgcolor: "transparent" }}>
          Drawing
        </ListSubheader>
        <MenuItem onClick={run(save)}>
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save drawing</ListItemText>
          <Typography variant="caption" color="text.secondary">
            Ctrl S
          </Typography>
        </MenuItem>
        <MenuItem onClick={run(download)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download PNG and JSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => openSettings("insert"))}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert text, image or overlay</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => openSettings("canvas"))}>
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Canvas settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(resetPanels)}>
          <ListItemIcon>
            <ResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Put the panels back</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(clear)}>
          <ListItemIcon>
            <ClearIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear canvas</ListItemText>
        </MenuItem>
        <Divider />
        <ListSubheader sx={{ lineHeight: "32px", bgcolor: "transparent" }}>
          Theme
        </ListSubheader>
        {MODES.map(({ value, label, icon }) => (
          <MenuItem
            key={value}
            role="menuitemradio"
            aria-checked={mode === value}
            selected={mode === value}
            onClick={() => setMode(value)}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText>{label}</ListItemText>
            {mode === value && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={run(openShortcuts)}>
          <ListItemIcon>
            <KeyboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Keyboard shortcuts</ListItemText>
          <Typography variant="caption" color="text.secondary">
            ?
          </Typography>
        </MenuItem>
        <MenuItem
          component="a"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
          onClick={close}>
          <ListItemIcon>
            <GitHubIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>GitHub</ListItemText>
        </MenuItem>
      </Menu>
    </Island>
  );
};

export default MainMenu;
