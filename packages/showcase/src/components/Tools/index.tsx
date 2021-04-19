import * as React from "react";
import ToolSelector from "./ToolSelector";

import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paper: {
    color: theme.palette.text.secondary,
  },
}));

const SketchTools = (): JSX.Element => {
  const classes = useStyles();

  const [tool, setTool] = React.useState("pencil");
  const [lineColor, setLineColor] = React.useState("black");
  const [fillColor, setFillColor] = React.useState("transparent");

  const handleSelectTool = (event, tool) => {
    tool != null && setTool(tool);
  };

  const handleLineColor = (color, event) => {
    color != null && setLineColor(color.hex);
  };

  const handleFillColor = (color, event) => {
    color != null && setFillColor(color.hex);
  };

  return (
    <Paper className={classes.paper}>
      <ToolSelector selected={tool} onChange={handleSelectTool} />
    </Paper>
  );
};

export { SketchTools };
export default SketchTools;
