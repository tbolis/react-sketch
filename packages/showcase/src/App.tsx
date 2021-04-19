import "./App.css";
import * as React from "react";
import { makeStyles } from "@material-ui/core";
import { ConfigOptions } from "./index";

const useStyles = makeStyles((theme) => ({
  grid: {
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

export interface Config {
  options: ConfigOptions;
}

/**
 * Export a simple showcase application to demonstrate React SketchField
 * capabilities
 */
export const App = (props): JSX.Element => {
  // const classes = useStyles();
  return <div>HELLO: {props.selectedTool}</div>;
};
