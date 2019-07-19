import React from 'react';
import './main.css'
import ThemeProvider from './layout/theme'
import Header from './layout/header'
import {makeStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import SketchCanvas from "./layout/canvas";
import SketchTools from "./layout/tools";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));


const App = () => {
  const classes = useStyles();

  return (
    <ThemeProvider>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Header/>
        </Grid>
        <Grid item xs={12} sm={9}>
          <SketchCanvas/>
        </Grid>
        <Grid item xs={12} sm={3}>
          <SketchTools/>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default App