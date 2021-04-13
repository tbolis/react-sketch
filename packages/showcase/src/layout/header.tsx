import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";

import Logo from "../static/react-sketch-logo.jpg";

const useStyles = makeStyles((theme) => ({
  avatar: {
    marginRight: theme.spacing(1),
  },
}));

const Header = (): JSX.Element => {
  const classes = useStyles();
  return (
    <AppBar title="Sketch Tool" position="static">
      <Toolbar>
        <Avatar alt="Remy Sharp" src={Logo} className={classes.avatar} />
        <Typography variant="h5" color="inherit" style={{ flexGrow: 1 }}>
          Sketch Tool
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
