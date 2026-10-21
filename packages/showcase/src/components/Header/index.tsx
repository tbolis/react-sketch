import type { ReactElement } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

import Logo from "./react-sketch-logo.jpg";

const Header = (): ReactElement => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Avatar alt="React Sketch logo" src={Logo} sx={{ mr: 1 }} />
        <Typography variant="h5" color="inherit" sx={{ flexGrow: 1 }}>
          Sketch Tool
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export { Header };
export default Header;
