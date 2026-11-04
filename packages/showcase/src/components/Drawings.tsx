import type { ReactElement } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { CONFIG } from "../stores/config";
import { downloadUrl } from "../utils/files";

/**
 * The drawings saved with the save action, in a drawer
 */
const Drawings = observer((): ReactElement => {
  const { drawings, drawingsOpen } = CONFIG;
  const close = () => (CONFIG.drawingsOpen = false);

  return (
    <Drawer
      anchor="right"
      open={drawingsOpen}
      onClose={close}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 360 }, p: 2 } } }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" component="h2">
          Saved drawings
        </Typography>
        <IconButton aria-label="Close the saved drawings" onClick={close}>
          <CloseIcon />
        </IconButton>
      </Stack>
      {drawings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing saved yet. Use Save drawing in the menu, or press Ctrl S, to keep a
          copy of the canvas here.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 1.5,
          }}>
          {drawings.map((drawing, index) => (
            <Box
              key={drawing.id}
              sx={{
                position: "relative",
                bgcolor: "common.white",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}>
              <Box
                component="img"
                src={drawing.src}
                alt={`Saved drawing ${index + 1}`}
                sx={{ display: "block", width: 1 }}
              />
              <Box sx={{ position: "absolute", top: 0, right: 0, display: "flex" }}>
                <IconButton
                  size="small"
                  aria-label={`Download saved drawing ${index + 1}`}
                  sx={{ color: "common.black" }}
                  onClick={() =>
                    downloadUrl(drawing.src, `drawing-${drawing.id}.png`)
                  }>
                  <DownloadIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`Remove saved drawing ${index + 1}`}
                  sx={{ color: "common.black" }}
                  onClick={() =>
                    (CONFIG.drawings = drawings.filter((d) => d.id !== drawing.id))
                  }>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Drawer>
  );
});

export default Drawings;
