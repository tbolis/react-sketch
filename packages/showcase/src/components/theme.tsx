import type { ReactNode } from "react";
import { cyan } from "@mui/material/colors";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: cyan,
    mode: "dark",
  },
  // The font of the page, no font is loaded from another site
  typography: { fontFamily: "inherit" },
});

const ShowcaseTheme = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default ShowcaseTheme;
