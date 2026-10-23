import type { ReactElement } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CONFIG, type Config } from "../../../stores/config";
import { downloadUrl } from "../../../utils/files";

/**
 * The drawings saved with the save action
 */
const Drawings = ({ drawings }: Pick<Config, "drawings">): ReactElement | null => {
  if (drawings.length === 0) {
    return null;
  }

  return (
    <>
      <Typography variant="overline">Saved drawings</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {drawings.map((drawing, index) => (
          <Box
            key={drawing.id}
            sx={{ position: "relative", width: 160, bgcolor: "common.white" }}>
            <Box
              component="img"
              src={drawing.src}
              alt={`Saved drawing ${index + 1}`}
              sx={{ width: 1 }}
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
    </>
  );
};

export default Drawings;
