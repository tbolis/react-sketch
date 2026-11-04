import Paper, { type PaperProps } from "@mui/material/Paper";

/**
 * A panel which floats over the canvas. The page around the canvas does not take
 * the pointer, so it is the island which does.
 */
const Island = ({ sx, ...props }: PaperProps) => (
  <Paper
    elevation={3}
    {...props}
    sx={[
      {
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        pointerEvents: "auto",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

export default Island;
