import type { ReactElement } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { SHORTCUTS } from "../shortcuts";
import { CONFIG } from "../stores/config";

/**
 * The keyboard shortcuts of the page, in a dialog
 */
const ShortcutsDialog = observer((): ReactElement => (
  <Dialog
    open={CONFIG.shortcutsOpen}
    onClose={() => (CONFIG.shortcutsOpen = false)}
    scroll="paper"
    maxWidth="sm"
    fullWidth
    aria-labelledby="shortcuts-title">
    <DialogTitle id="shortcuts-title">Keyboard shortcuts</DialogTitle>
    <DialogContent dividers>
      {SHORTCUTS.map(({ group, items }) => (
        <Box key={group} component="section" sx={{ mb: 2 }}>
          <Typography variant="overline" component="h3">
            {group}
          </Typography>
          <Box component="dl" sx={{ m: 0 }}>
            {items.map(({ keys, description }) => (
              <Box
                key={description}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 0.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}>
                <Typography component="dt" variant="body2">
                  {description}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{ m: 0, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {keys}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </DialogContent>
  </Dialog>
));

export default ShortcutsDialog;
