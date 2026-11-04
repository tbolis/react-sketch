import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface LabeledSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onChange: (value: number) => void;
}

/**
 * A single value slider with a label and optional icons at both ends
 */
const LabeledSlider = (props: LabeledSliderProps): ReactElement => {
  const labelId = useId();
  const { label, startIcon, endIcon, onChange, ...slider } = props;

  return (
    <>
      <Typography id={labelId} variant="body2">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {startIcon}
        <Slider
          {...slider}
          aria-labelledby={labelId}
          valueLabelDisplay="auto"
          onChange={(event, value) =>
            onChange(Array.isArray(value) ? value[0] : value)
          }
        />
        {endIcon}
      </Stack>
    </>
  );
};

export default LabeledSlider;
