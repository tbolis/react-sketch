import * as CSS from "csstype";

interface SketchProperties {
  className?: string;
  style?: CSS.Properties;
  height?: number;
  width?: number;
  autoresize?: boolean;
  tool: string;
}
