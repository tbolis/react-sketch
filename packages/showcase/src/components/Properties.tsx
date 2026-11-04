import type { ReactElement, ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import PasteIcon from "@mui/icons-material/ContentPaste";
import RemoveIcon from "@mui/icons-material/Remove";
import StyleIcon from "@mui/icons-material/Palette";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import {
  NO_LINE_STYLE,
  NO_PROPERTIES,
  copy,
  paste,
  removeSelected,
} from "../actions";
import { CONFIG } from "../stores/config";
import { toolByValue } from "../tools";
import ColorPicker from "./ColorPicker";
import Island from "./Island";
import LabeledSlider from "./LabeledSlider";
import LineStyleSelector from "./LineStyleSelector";

/** The weights next to the slider, one tap away */
const QUICK_WIDTHS = [
  { value: 1, label: "Thin" },
  { value: 4, label: "Bold" },
  { value: 10, label: "Extra bold" },
];

interface ActionProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Action = ({ label, disabled, onClick, children }: ActionProps) => (
  <Tooltip title={label}>
    <span>
      <IconButton aria-label={label} disabled={disabled} onClick={onClick}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

/**
 * The line, the colors and the style of what the tool draws, and the actions on the
 * selected objects. It floats at the left of the canvas, and the tools which draw
 * nothing leave it with the actions only.
 */
const Properties = observer((): ReactElement => {
  const { selectedTool, propertiesOpen, hasSelection, canPaste } = CONFIG;
  const drawing = !NO_PROPERTIES.includes(selectedTool);
  const tool = toolByValue(selectedTool);

  if (!propertiesOpen) {
    return (
      <Island sx={{ p: 0.5, width: "fit-content" }}>
        <Tooltip title="Properties">
          <IconButton
            aria-label="Show the properties"
            aria-expanded={false}
            onClick={() => (CONFIG.propertiesOpen = true)}>
            <StyleIcon sx={{ color: CONFIG.lineColor }} />
          </IconButton>
        </Tooltip>
      </Island>
    );
  }

  return (
    <Island
      component="section"
      aria-label="Properties"
      sx={{
        width: 232,
        maxHeight: "100%",
        overflowY: "auto",
        p: 1.5,
      }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="overline" component="h2" sx={{ lineHeight: 2 }}>
          {drawing ? (tool?.label ?? "Tool") : "Selection"}
        </Typography>
        <Tooltip title="Hide the properties">
          <IconButton
            size="small"
            aria-label="Hide the properties"
            aria-expanded
            onClick={() => (CONFIG.propertiesOpen = false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      {drawing && (
        <Stack spacing={1.5} sx={{ mb: 1.5 }}>
          <ColorPicker
            label="Line color"
            value={CONFIG.lineColor}
            onChange={(color) => color && (CONFIG.lineColor = color)}
          />
          <ColorPicker
            label="Fill color"
            allowNone
            value={CONFIG.fillWithColor ? CONFIG.fillColor : null}
            fallback={CONFIG.fillColor}
            onChange={(color) => {
              CONFIG.fillWithColor = color !== null;
              if (color) CONFIG.fillColor = color;
            }}
          />
          <Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              fullWidth
              aria-label="Line weight presets"
              value={CONFIG.lineWidth}
              onChange={(_event, value: number | null) => {
                if (value !== null) CONFIG.lineWidth = value;
              }}>
              {QUICK_WIDTHS.map(({ value, label }) => (
                <ToggleButton
                  key={value}
                  value={value}
                  aria-label={label}
                  title={label}>
                  <Box
                    sx={{
                      width: 24,
                      height: `${Math.min(value, 10)}px`,
                      bgcolor: "currentColor",
                      borderRadius: 1,
                    }}
                  />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <LabeledSlider
              label="Line weight"
              value={CONFIG.lineWidth}
              min={1}
              max={100}
              startIcon={<RemoveIcon fontSize="small" />}
              endIcon={<AddIcon fontSize="small" />}
              onChange={(value) => (CONFIG.lineWidth = value)}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Line style
            </Typography>
            <LineStyleSelector
              selected={CONFIG.lineStyle}
              disabled={NO_LINE_STYLE.includes(selectedTool)}
            />
          </Box>
          <Divider />
        </Stack>
      )}
      <Typography variant="caption" color="text.secondary" component="p">
        Selected objects
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <Action
          label="Copy selected (Ctrl C)"
          disabled={!hasSelection}
          onClick={copy}>
          <CopyIcon />
        </Action>
        <Action label="Paste (Ctrl V)" disabled={!canPaste} onClick={paste}>
          <PasteIcon />
        </Action>
        <Action
          label="Delete selected (Delete)"
          disabled={!hasSelection}
          onClick={removeSelected}>
          <DeleteIcon />
        </Action>
      </Stack>
    </Island>
  );
});

export default Properties;
