import { useState } from "react";
import type { ReactElement } from "react";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { PREVIEW_MULTIPLIER } from "../sketchRef";
import { CONFIG } from "../stores/config";
import Island from "./Island";
import { useMovable } from "./Movable";

/**
 * A small copy of the whole drawing, drawn again after each change with
 * `toDataURL({ multiplier })`. When the view is zoomed or panned, a frame shows
 * the part of the drawing which the canvas shows, as a minimap does.
 */
const Preview = observer((): ReactElement => {
  const { preview, view, previewOpen, empty } = CONFIG;
  const { ref, style, grip } = useMovable("preview", "preview");
  // The size of the image, which is the size of the canvas times the multiplier
  const [size, setSize] = useState({ width: 0, height: 0 });
  const moved = view.zoom !== 1 || view.x !== 0 || view.y !== 0;
  // The canvas is size / multiplier, and the view puts its origin at x, y
  const frame = {
    left: `${((-view.x * PREVIEW_MULTIPLIER) / (view.zoom * size.width)) * 100}%`,
    top: `${((-view.y * PREVIEW_MULTIPLIER) / (view.zoom * size.height)) * 100}%`,
    width: `${100 / view.zoom}%`,
    height: `${100 / view.zoom}%`,
  };

  return (
    <Island
      ref={ref}
      style={style}
      component="section"
      aria-label="Preview"
      sx={{ p: 1, width: "100%" }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
          {grip}
          <Typography variant="overline" component="h2" sx={{ lineHeight: 2 }}>
            Preview
          </Typography>
        </Stack>
        <IconButton
          size="small"
          aria-label={previewOpen ? "Hide the preview" : "Show the preview"}
          aria-expanded={previewOpen}
          onClick={() => (CONFIG.previewOpen = !previewOpen)}>
          {previewOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Stack>
      {previewOpen &&
        (!empty && preview ? (
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              lineHeight: 0,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "common.white",
            }}>
            <Box
              component="img"
              src={preview}
              alt="Preview of the drawing"
              sx={{ display: "block", width: 1, height: "auto" }}
              onLoad={(event) =>
                setSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
            {moved && size.width > 0 && size.height > 0 && (
              <Box
                data-testid="preview-frame"
                sx={{
                  position: "absolute",
                  boxSizing: "border-box",
                  border: "2px solid",
                  borderColor: "primary.main",
                  ...frame,
                }}
              />
            )}
          </Box>
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ px: 0.5 }}>
            {empty
              ? "Nothing drawn yet. The whole drawing shows here, a quarter of its size."
              : "No preview: an image of the canvas comes from another site that does not allow it (CORS)."}
          </Typography>
        ))}
    </Island>
  );
});

export default Preview;
