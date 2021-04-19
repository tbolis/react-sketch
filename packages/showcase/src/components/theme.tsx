import * as React from "react";
import blue from "@material-ui/core/colors/cyan";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    primary: blue,
    type: "dark",
  },
});

const ShowcaseTheme = ({ children }): JSX.Element => {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};

export default ShowcaseTheme;
