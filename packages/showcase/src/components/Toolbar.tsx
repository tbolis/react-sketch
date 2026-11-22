import type { ReactElement } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { observer } from "mobx-react-lite";
import { selectTool } from "../actions";
import { CONFIG } from "../stores/config";
import { TOOL_GROUPS, toolDigit } from "../tools";
import Island from "./Island";
import { useMovable } from "./Movable";

/**
 * The tools of the canvas, in groups. It is one choice: selecting a tool in a group
 * clears the one of the other groups.
 */
const Toolbar = observer((): ReactElement => {
  const selected = CONFIG.selectedTool;
  const { ref, style, grip } = useMovable("toolbar", "tools");

  return (
    <Island
      ref={ref}
      style={style}
      component="nav"
      aria-label="Tools"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        p: 0.5,
        maxWidth: "calc(100vw - 16px)",
        overflowX: "auto",
      }}>
      {grip}
      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
      {TOOL_GROUPS.map((group, index) => (
        <Box
          key={group[0].value}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {index > 0 && <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />}
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={selected}
            aria-label={`Tools ${index + 1}`}
            onChange={(_event, value: string | null) => {
              // A click on the selected tool keeps it
              if (value !== null) selectTool(value);
            }}
            sx={{
              gap: 0.25,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: 2,
                m: 0,
                p: 1,
                position: "relative",
                "&:not(:first-of-type), &:not(:last-of-type)": { borderRadius: 2 },
              },
            }}>
            {group.map((tool) => {
              const digit = toolDigit(tool);
              const shortcut = [tool.key.toUpperCase(), digit]
                .filter(Boolean)
                .join(" or ");
              return (
                // The group reads the value of its children, and the tooltip is the child
                <Tooltip
                  key={tool.value}
                  title={`${tool.label} (${shortcut})`}
                  {...{ value: tool.value }}>
                  <ToggleButton value={tool.value} aria-label={tool.label}>
                    {tool.icon}
                    {digit && (
                      <Box
                        component="span"
                        aria-hidden="true"
                        sx={{
                          position: "absolute",
                          right: 3,
                          bottom: 1,
                          fontSize: 9,
                          lineHeight: 1,
                          opacity: 0.7,
                        }}>
                        {digit}
                      </Box>
                    )}
                  </ToggleButton>
                </Tooltip>
              );
            })}
          </ToggleButtonGroup>
        </Box>
      ))}
    </Island>
  );
});

export default Toolbar;
