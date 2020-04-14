import React from 'react';
import './main.css'
import ThemeProvider from './layout/theme'
import Header from './layout/header'
import Grid from '@material-ui/core/Grid';
import SketchCanvas from "./layout/canvas";
import SketchTools from "./layout/tools";

const App = () => (
  <ThemeProvider>
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Header/>
      </Grid>
      <Grid item xs={12} sm={12} md={8} lg={7}>
        <SketchCanvas/>
      </Grid>
      <Grid item xs={12} sm={12} md={4} lg={5}>
        <SketchTools/>
      </Grid>
    </Grid>
  </ThemeProvider>
);

export default App