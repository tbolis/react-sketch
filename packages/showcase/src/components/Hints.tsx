import type { ReactElement } from "react";
import BrushIcon from "@mui/icons-material/Brush";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { scenarioInfo } from "../scenarios";
import { CONFIG } from "../stores/config";
import { toolByValue } from "../tools";
import Island from "./Island";

/**
 * What to do with the tool in use, at the bottom of the canvas
 */
const ToolHint = observer((): ReactElement | null => {
  const tool = toolByValue(CONFIG.selectedTool);
  if (!tool) return null;

  return (
    <Island
      role="status"
      sx={{ px: 1.5, py: 0.75, maxWidth: 560, bgcolor: "background.paper" }}>
      <Typography variant="caption" color="text.secondary">
        {tool.hint}
      </Typography>
    </Island>
  );
});

/**
 * The welcome of a canvas with nothing on it, in the middle of the canvas. It takes
 * no pointer, so the first stroke can start anywhere.
 */
const Welcome = observer((): ReactElement | null => {
  if (!CONFIG.empty) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        textAlign: "center",
        color: "#00000066",
        pointerEvents: "none",
        px: 2,
      }}>
      <BrushIcon sx={{ fontSize: 48 }} />
      <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
        {scenarioInfo(CONFIG.scenario).label}
      </Typography>
      <Typography variant="body2">
        Pick a tool and draw. Press ? for the keyboard shortcuts.
      </Typography>
    </Box>
  );
});

export { ToolHint, Welcome };
