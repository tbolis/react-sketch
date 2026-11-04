import { useState } from "react";
import type { ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { teal } from "@mui/material/colors";
import { type Config } from "../../../stores/config";
import { PREVIEW_MULTIPLIER } from "../../Canvas/sketchRef";
import Section from "../Section";

type PreviewProps = Pick<Config, "preview" | "view">;

/**
 * A small copy of the whole drawing, drawn again after each change with
 * `toDataURL({ multiplier })`. When the view is zoomed or panned, a frame shows
 * the part of the drawing which the canvas shows, as a minimap does.
 */
const Preview = ({ preview, view }: PreviewProps): ReactElement => {
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
    <Section id="preview" title="Preview" defaultExpanded>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The whole drawing, a quarter of its size, drawn again after each change. With
        the view zoomed or panned, the frame is what the canvas shows.
      </Typography>
      {preview ? (
        <Box
          sx={{
            position: "relative",
            display: "inline-block",
            overflow: "hidden",
            lineHeight: 0,
            border: 1,
            borderColor: "divider",
            backgroundColor: teal[50],
          }}>
          <img
            src={preview}
            alt="Preview of the drawing"
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
        <Typography variant="caption" component="p">
          Nothing drawn yet.
        </Typography>
      )}
    </Section>
  );
};

export default Preview;
