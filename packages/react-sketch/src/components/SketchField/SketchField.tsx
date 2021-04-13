import * as React from "react";
import * as CSS from "csstype";
import { fabric } from "fabric";
import PropTypes from "prop-types";
import { PureComponent } from "react";
import { FabricCanvasTool, initialize_tool } from "./tools";

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

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends PureComponent<SketchProperties, SketchState> {
  private canvas: fabric.Canvas | null;
  private canvasEl: HTMLCanvasElement | null;
  private containerEl: HTMLDivElement | null;
  private tool: any | null;

  constructor(props: SketchProperties) {
    super(props);
    this.canvas = null;
    this.canvasEl = null;
    this.containerEl = null;
    this.tool = null;
  }

  static propTypes = {
    tool: PropTypes.string,
    lineColor: PropTypes.string,
  };

  static defaultProps = {
    lineColor: "black",
  };

  state = {
    action: true,
  };

  componentDidMount = (): void => {
    const { tool } = this.props;
    this.canvas = new fabric.Canvas(this.canvasEl);
    this.tool = initialize_tool(this.canvas, this.props, tool);
  };

  render = (): JSX.Element => {
    const { className, style, width, height } = this.props;

    const canvasDivStyle = Object.assign(
      {},
      style ? style : {},
      width ? { width: width } : {},
      height ? { height: height } : { height: 512 }
    );

    return (
      <div
        className={className}
        style={canvasDivStyle}
        ref={(c) => (this.containerEl = c)}
      >
        <canvas ref={(c) => (this.canvasEl = c)}>
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    );
  };
}

export default SketchField;
