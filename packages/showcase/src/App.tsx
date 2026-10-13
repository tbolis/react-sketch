import "./App.css";
import type { ReactElement } from "react";
import { Config } from "./stores/config";
import Grid from "@mui/material/Grid";
import ThemeProvider from "./components/theme";
import { Header, SketchCanvas, SketchTools } from "./components";

/**
 * Export a simple showcase application to demonstrate React SketchField
 * capabilities
 */
export const App = (props: Config): ReactElement => {
  return (
    <ThemeProvider>
      <Grid container sx={{ color: "text.secondary" }}>
        <Grid size={12}>
          <Header />
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 7 }} sx={{ p: 1.2 }}>
          <SketchCanvas {...props} />
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 5 }} sx={{ p: 1.2 }}>
          <SketchTools {...props} />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};
