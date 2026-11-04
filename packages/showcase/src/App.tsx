import type { ReactElement } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Snackbar from "@mui/material/Snackbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { observer } from "mobx-react-lite";
import BottomBar from "./components/BottomBar";
import Drawings from "./components/Drawings";
import { ToolHint, Welcome } from "./components/Hints";
import MainMenu from "./components/MainMenu";
import Preview from "./components/Preview";
import Properties from "./components/Properties";
import Settings from "./components/Settings";
import ShortcutsDialog from "./components/ShortcutsDialog";
import Toolbar from "./components/Toolbar";
import TopRight from "./components/TopRight";
import Workspace from "./components/Workspace";
import { useShortcuts } from "./shortcuts";
import { CONFIG, DESKTOP_QUERY } from "./stores/config";

/** The width of the panels at the right of the canvas */
const SIDE_WIDTH = 328;

/**
 * The showcase of react-sketch: a canvas which fills the window, with the tools, the
 * properties, the settings and the zoom floating over it.
 */
export const App = observer((): ReactElement => {
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const { notice, settingsOpen } = CONFIG;
  useShortcuts();

  return (
    <Box sx={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <Workspace />
      <Welcome />
      {/* The layer of the panels takes no pointer, only the panels do: the canvas is under it */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1,
          pointerEvents: "none",
        }}>
        <Box
          sx={{
            display: "grid",
            alignItems: "start",
            gap: 1,
            gridTemplateAreas: {
              xs: '"menu right" "tools tools"',
              lg: '"menu tools right"',
            },
            gridTemplateColumns: { xs: "1fr auto", lg: "1fr auto 1fr" },
          }}>
          <Box sx={{ gridArea: "menu", justifySelf: "start" }}>
            <MainMenu />
          </Box>
          <Box sx={{ gridArea: "tools", justifySelf: "center", maxWidth: 1 }}>
            <Toolbar />
          </Box>
          <Box sx={{ gridArea: "right", justifySelf: "end" }}>
            <TopRight />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            justifyContent: "space-between",
            gap: 1,
          }}>
          <Box sx={{ minHeight: 0, display: "flex", alignItems: "flex-start" }}>
            <Properties />
          </Box>
          {desktop && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 1,
                minHeight: 0,
                width: SIDE_WIDTH,
                maxWidth: "40vw",
              }}>
              {settingsOpen && <Settings />}
              <Preview />
            </Box>
          )}
        </Box>
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <BottomBar />
          </Box>
          <Box sx={{ display: "flex", flex: "1 1 240px", justifyContent: "center" }}>
            <ToolHint />
          </Box>
          {/* Keeps the hint in the middle of the window */}
          {desktop && <Box sx={{ width: 190 }} />}
        </Box>
      </Box>
      {!desktop && (
        <Drawer
          anchor="bottom"
          open={settingsOpen}
          onClose={() => (CONFIG.settingsOpen = false)}
          slotProps={{
            paper: {
              sx: {
                maxHeight: "75%",
                bgcolor: "transparent",
                backgroundImage: "none",
                boxShadow: "none",
                p: 1,
              },
            },
          }}>
          <Settings />
        </Drawer>
      )}
      <Drawings />
      <ShortcutsDialog />
      <Snackbar
        open={notice !== ""}
        autoHideDuration={6000}
        message={notice}
        sx={{ bottom: { xs: 96, md: 72 } }}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") CONFIG.notice = "";
        }}
      />
    </Box>
  );
});

export default App;
