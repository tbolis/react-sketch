import React from "react";
import {makeStyles} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  verticalLabel: {
    width: "24px",
    display: "inline-block",
    verticalAlign: "bottom",
    textOrientation: "mixed",
    writingMode: "sideways-lr",
    marginRight: theme.spacing(1),
  }
}));

export default props => {
  const classes = useStyles();

  return (
    <div className={classes.verticalLabel}>
      {props.label}
    </div>
  )
}