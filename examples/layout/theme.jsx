import React from 'react';
import {createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/cyan';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    type: 'dark',
  },
  typography: {
    useNextVariants: true,
  },
});

export default function({ children }) {
  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
}