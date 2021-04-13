import * as React from "react";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";
import { teal } from "@material-ui/core/colors";
import SketchField from "react-sketch";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  sketch: {
    backgroundColor: teal[50],
  },
}));

const SketchCanvas = (): JSX.Element => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <SketchField /*className={classes.sketch}*/ tool={"pencil"} />
    </Paper>
  );
};

export default SketchCanvas;
