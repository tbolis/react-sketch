import React from "react";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";
import ToolSelector from "../tools/ToolSelector";
import ColorSelector from "../tools/ColorSelector";
import CanvasControls from "../tools/CanvasControls";
import Background from "../tools/Background";
import Text from "../tools/Text";
import ImageControls from "../tools/ImageControls";

const useStyles = makeStyles((theme) => ({
  paper: {
    color: theme.palette.text.secondary,
  },
}));

export default function () {
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
      <ColorSelector
        lineColor={lineColor}
        fillColor={fillColor}
        onChangeLineColor={handleLineColor}
        onChangeFillColor={handleFillColor}
      />
      <Text />
      <Background />
      <CanvasControls />
      <ImageControls />
    </Paper>
  );
}
