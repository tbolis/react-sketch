import "./App.css";
import * as React from "react";
import { Config } from "./stores/config";
import Grid from "@material-ui/core/Grid";
import ThemeProvider from "./components/theme";
import { makeStyles } from "@material-ui/core";
import { Header, SketchCanvas, SketchTools } from "./components";

const useStyles = makeStyles((theme) => ({
  grid: {
    color: theme.palette.text.secondary,
  },
  item: {
    padding: theme.spacing(1.2),
  },
}));

/**
 * Export a simple showcase application to demonstrate React SketchField
 * capabilities
 */
export const App = (props: Config): JSX.Element => {
  const classes = useStyles();

  return (
    <ThemeProvider>
      <Grid container className={classes.grid}>
        <Grid item xs={12}>
          <Header {...props} />
        </Grid>
        <Grid item xs={12} sm={12} md={8} lg={7} className={classes.item}>
          <SketchCanvas {...props} />
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={5} className={classes.item}>
          <SketchTools {...props} />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};
