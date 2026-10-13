import type { ReactElement } from "react";
import Slider from "@mui/material/Slider";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import Grid from "@mui/material/Grid";

interface LineWidthProps {
  width: number;
  onChange?: (event: Event, value: number | number[]) => void;
}

const LineWidth = (props: LineWidthProps): ReactElement => {
  return (
    <Grid container spacing={1}>
      <Grid>
        <RemoveIcon />
      </Grid>
      <Grid size="grow">
        <Slider
          value={props.width}
          onChange={props.onChange}
          aria-labelledby="continuous-slider"
        />
      </Grid>
      <Grid>
        <AddIcon />
      </Grid>
    </Grid>
  );
};

export default LineWidth;
