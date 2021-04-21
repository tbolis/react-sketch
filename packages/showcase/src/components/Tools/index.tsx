import * as React from "react";
import ToolSelector from "./ToolSelector";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";
import { Config } from "../../stores/config";
import { CONFIG } from "../../stores/config";

const useStyles = makeStyles((theme) => ({
  paper: {
    color: theme.palette.text.secondary,
  },
}));

/**
 * Handle the selection of the Sketch tool
 *
 * @param {object} event The event source of the callback.
 * @param {any} value of the selected buttons. When `exclusive` is true
 */
const handleSelectTool = (event: React.MouseEvent<HTMLElement>, value: any) => {
  CONFIG.selectedTool = value;
};

const SketchTools = (props: Config): JSX.Element => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <ToolSelector selected={props.selectedTool} onChange={handleSelectTool} />
    </Paper>
  );
};

export { SketchTools };
export default SketchTools;
