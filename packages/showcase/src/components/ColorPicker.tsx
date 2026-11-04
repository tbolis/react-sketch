import { useId, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import BlockIcon from "@mui/icons-material/Block";
import PaletteIcon from "@mui/icons-material/Palette";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

/** The colors next to the label, one tap away */
const QUICK_COLORS = ["#000000", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];

/** The colors of the popover: black, white, and the 500 of each color of Material Design */
const PALETTE = [
  "#000000",
  "#ffffff",
  blueGrey[500],
  brown[500],
  red[500],
  pink[500],
  purple[500],
  deepPurple[500],
  indigo[500],
  blue[500],
  lightBlue[500],
  cyan[500],
  teal[500],
  green[500],
  lightGreen[500],
  lime[500],
  yellow[500],
  amber[500],
  orange[500],
  deepOrange[500],
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The #rrggbb of a color the native input takes, #rgb is spelled out */
const toHex6 = (color: string): string =>
  /^#[0-9a-f]{3}$/i.test(color)
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;

interface SwatchProps {
  color: string | null;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const Swatch = ({ color, label, selected, disabled, onClick }: SwatchProps) => (
  <ButtonBase
    aria-label={label}
    aria-pressed={selected}
    title={label}
    disabled={disabled}
    onClick={onClick}
    sx={{
      width: 28,
      height: 28,
      borderRadius: 1.5,
      border: 1,
      borderColor: "divider",
      bgcolor: color ?? "background.paper",
      color: "text.secondary",
      outline: selected ? "2px solid" : "none",
      outlineColor: "primary.main",
      outlineOffset: 1,
      opacity: disabled ? 0.4 : 1,
    }}>
    {color === null && <BlockIcon sx={{ fontSize: 18 }} />}
  </ButtonBase>
);

interface ColorPickerProps {
  label: string;
  /** The color, or null for none (when none is allowed) */
  value: string | null;
  /** The color to show on the last swatch while there is none */
  fallback?: string;
  allowNone?: boolean;
  disabled?: boolean;
  onChange: (color: string | null) => void;
}

/**
 * Pick a color from a few swatches, from the palette of Material Design, or by its
 * hex code or the color input of the browser. The value is a #rrggbb string.
 */
const ColorPicker = ({
  label,
  value,
  fallback = "#000000",
  allowNone,
  disabled,
  onChange,
}: ColorPickerProps): ReactElement => {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = value ?? fallback;
  const quick = QUICK_COLORS.includes(current.toLowerCase());
  const [hex, setHex] = useState<string | null>(null);
  const hexValue = hex ?? current;
  const invalid = hex !== null && !HEX.test(hex);

  const pick = (color: string) => onChange(toHex6(color).toLowerCase());

  return (
    <Box role="group" aria-labelledby={id}>
      <Typography id={id} variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5 }}>
        {allowNone && (
          <Swatch
            color={null}
            label={`${label}: none`}
            selected={value === null}
            disabled={disabled}
            onClick={() => onChange(null)}
          />
        )}
        {QUICK_COLORS.map((color) => (
          <Swatch
            key={color}
            color={color}
            label={`${label}: ${color}`}
            selected={value?.toLowerCase() === color}
            disabled={disabled}
            onClick={() => pick(color)}
          />
        ))}
        <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: "divider" }} />
        <ButtonBase
          aria-label={`${label}: more colors`}
          aria-haspopup="dialog"
          title="More colors"
          disabled={disabled}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            bgcolor: current,
            color: "common.white",
            outline: value !== null && !quick ? "2px solid" : "none",
            outlineColor: "primary.main",
            outlineOffset: 1,
            opacity: disabled ? 0.4 : 1,
          }}>
          <PaletteIcon sx={{ fontSize: 16, mixBlendMode: "difference" }} />
        </ButtonBase>
      </Stack>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null);
          setHex(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 1.5, width: 236 } } }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 0.75,
            my: 1,
          }}>
          {PALETTE.map((color) => (
            <Swatch
              key={color}
              color={color}
              label={color}
              selected={value?.toLowerCase() === color.toLowerCase()}
              onClick={() => pick(color)}
            />
          ))}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <TextField
            size="small"
            label="Hex"
            value={hexValue}
            error={invalid}
            slotProps={{ htmlInput: { maxLength: 7, spellCheck: false } }}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const next = event.target.value.startsWith("#")
                ? event.target.value
                : `#${event.target.value}`;
              setHex(next);
              if (HEX.test(next)) pick(next);
            }}
            onBlur={() => setHex(null)}
          />
          <Box
            component="input"
            type="color"
            aria-label={`${label}: color input`}
            value={toHex6(current)}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setHex(null);
              pick(event.target.value);
            }}
            sx={{
              width: 40,
              height: 40,
              p: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        </Stack>
      </Popover>
    </Box>
  );
};

export default ColorPicker;
