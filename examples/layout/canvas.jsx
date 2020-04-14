import React from 'react';
import Paper from '@material-ui/core/Paper';
import {SketchField} from '../../src';
import {makeStyles} from "@material-ui/core";
import { teal } from '@material-ui/core/colors';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  sketch: {
    backgroundColor: teal[50]
  }
}));

export default () => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <SketchField
        name="sketch"
        className={classes.sketch}
      />
    </Paper>
  )
}