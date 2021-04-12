import "./App.css";
import * as React from "react";
import Grid from "@material-ui/core/Grid";
import ThemeProvider from "./layout/theme";
import Header from "./layout/header";

/**
 * Export a simple showcase application to demonstrate React SketchField
 * capabilities
 */
export const App = (): JSX.Element => {
  return (
    <ThemeProvider>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Header/>
        </Grid>
        <Grid item xs={12} sm={12} md={8} lg={7}>
          SketchCanvas
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={5}>
          SketchTools
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};
