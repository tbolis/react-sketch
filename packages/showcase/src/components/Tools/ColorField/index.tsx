import type { ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ColorFieldProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

/**
 * Color picker based on the native color input, the value is a #rrggbb string
 */
const ColorField = ({
  label,
  value,
  disabled,
  onChange,
}: ColorFieldProps): ReactElement => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        component="input"
        type="color"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: 48,
          height: 32,
          p: 0,
          border: 0,
          background: "none",
          cursor: "pointer",
        }}
      />
      <Typography variant="body2">{label}</Typography>
      <Typography variant="caption">{value}</Typography>
    </Box>
  );
};

export default ColorField;
