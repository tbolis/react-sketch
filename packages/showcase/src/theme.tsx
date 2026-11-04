import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

/** The font of the page, no font is loaded from another site */
const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Material Design, as a light and a dark color scheme (the CSS variables of Material UI
 * switch them, with no render). The scheme follows the system until the user picks one.
 */
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#6965db" },
        background: { default: "#f1f3f5", paper: "#ffffff" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#a8a5ff" },
        background: { default: "#17181c", paper: "#232329" },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: FONT_FAMILY, fontSize: 13 },
  // The ring of the keyboard focus, on every component
  focusVisible: true,
  components: {
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 400 } },
    MuiToggleButton: {
      styleOverrides: { root: { textTransform: "none" } },
    },
  },
});

const ShowcaseTheme = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme} defaultMode="system">
    <CssBaseline />
    {/* The page is the canvas: it does not scroll */}
    <GlobalStyles
      styles={{
        "html, body, #container": { height: "100%", margin: 0, overflow: "hidden" },
        body: { overscrollBehavior: "none" },
      }}
    />
    {children}
  </ThemeProvider>
);

export default ShowcaseTheme;
