import type { ReactElement } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CONFIG, type Config } from "../../../stores/config";

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
            key={index}
            sx={{ position: "relative", width: 160, bgcolor: "common.white" }}>
            <Box
              component="img"
              src={drawing}
              alt={`Saved drawing ${index + 1}`}
              sx={{ width: 1 }}
            />
            <IconButton
              size="small"
              aria-label={`Remove saved drawing ${index + 1}`}
              sx={{ position: "absolute", top: 0, right: 0, color: "common.black" }}
              onClick={() =>
                (CONFIG.drawings = drawings.filter((_, i) => i !== index))
              }>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default Drawings;
