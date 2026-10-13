import type { ReactElement } from "react";
import { SketchField, Types } from "react-sketch";
import Paper from "@mui/material/Paper";
import { teal } from "@mui/material/colors";
import { Config } from "../../stores/config";

const SketchCanvas = (props: Config): ReactElement => {
  const properties: Types.SketchProperties = {
    tool: props.selectedTool,
    lineWidth: props.lineWidth,
    autoresize: true,
  };

  return (
    <Paper sx={{ width: "100%", height: "100%", p: 1, color: "text.secondary" }}>
      <SketchField style={{ backgroundColor: teal[50] }} {...properties} />
    </Paper>
  );
};

export { SketchCanvas };
export default SketchCanvas;
