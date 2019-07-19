import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import UndoIcon from "@material-ui/core/SvgIcon/SvgIcon";
import RedoIcon from '@material-ui/icons/Redo';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import DownloadIcon from '@material-ui/icons/CloudDownload';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function ButtonAppBar() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar title="Sketch Tool" position="static" >
        <Toolbar>
          <Typography variant="h6" color="inherit" style={{ flexGrow: 1 }}>Sketch Tool</Typography>
          <IconButton
            color="primary">
            <UndoIcon/>
          </IconButton>
          <IconButton
            color="primary"
            >
            <RedoIcon/>
          </IconButton>
          <IconButton
            color="primary"
            >
            <SaveIcon/>
          </IconButton>
          <IconButton
            color="primary"
            >
            <DownloadIcon/>
          </IconButton>
          <IconButton
            color="primary">
            <DeleteIcon/>
          </IconButton>
        </Toolbar>
      </AppBar>

    </div>
  );
}