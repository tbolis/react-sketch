import * as CSS from "csstype";

interface SketchProperties {
  className?: string;
  style?: CSS.Properties;
  height?: number;
  width?: number;
  tool: string;
  lineColor?: string;
}

interface SketchState {
  action: boolean;
}

export { SketchState };
export { SketchProperties };
