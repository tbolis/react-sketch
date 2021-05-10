import React from "react";
import Slider from "@material-ui/core/Slider";
import ExposureNeg1Icon from "@material-ui/icons/ExposureNeg1";
import ExposurePlus1Icon from "@material-ui/icons/ExposurePlus1";
import Grid from "@material-ui/core/Grid";

interface LineWidthProps {
  width: number;
  onChange?: (event: React.ChangeEvent<{}>, value: number | number[]) => void;
}

const LineWidth = (props: LineWidthProps): JSX.Element => {
  return (
    <Grid container spacing={1}>
      <Grid item>
        <ExposureNeg1Icon />
      </Grid>
      <Grid item xs>
        <Slider
          value={props.width}
          onChange={props.onChange}
          aria-labelledby="continuous-slider"
        />
      </Grid>
      <Grid item>
        <ExposurePlus1Icon />
      </Grid>
    </Grid>
  );
};

export default LineWidth;
