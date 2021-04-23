import * as React from "react";
import { SketchField, Types } from "react-sketch";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";
import { teal } from "@material-ui/core/colors";
import { Config } from "../../stores/config";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    height: "100%",
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  sketch: {
    backgroundColor: teal[50],
  },
}));

const SketchCanvas = (props: Config): JSX.Element => {
  const classes = useStyles();

  const properties: Types.SketchProperties = {
    tool: props.selectedTool,
    //toolOptions: ,
    autoresize: true,
  };

  return (
    <Paper className={classes.paper}>
      <SketchField className={classes.sketch} {...properties} />
    </Paper>
  );
};

export { SketchCanvas };
export default SketchCanvas;
