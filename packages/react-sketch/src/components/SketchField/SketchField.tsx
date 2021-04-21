import * as React from "react";
import * as CSS from "csstype";
import PropTypes from "prop-types";
import { PureComponent } from "react";
import { FabricCanvasTool, initialize_tool } from "./tools";
import { autoresize } from "./resize";
import { fabric } from "fabric";

interface SketchStyle {
  className?: string;
  style?: CSS.Properties;
  autoresize?: boolean;
  height?: number;
  width?: number;
}

interface SketchTool {
  tool: string;
  lineColor?: string;
}

export interface SketchProperties extends SketchTool, SketchStyle {}

interface SketchState {
  action: boolean;
}

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

  /**
   * Listener function for the resize of canvas and objects
   * @param event the UIEvent of resize event
   */
  _resize_listener = (event: UIEvent): void => {
    this.canvas && this.containerEl && autoresize(this.canvas, this.containerEl);
  };

  componentDidMount = (): void => {
    const { tool } = this.props;
    this.canvas = new fabric.Canvas(this.canvasEl);
    this.tool = initialize_tool(this.canvas, this.props, tool);
    this.containerEl && autoresize(this.canvas, this.containerEl);
    window && window.addEventListener("resize", this._resize_listener);
  };

  componentWillUnmount = (): void => {
    window.removeEventListener("resize", this._resize_listener, true);
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
        ref={(elem) => (this.containerEl = elem)}>
        <canvas ref={(elem) => (this.canvasEl = elem)}>
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    );
  };
}

export default SketchField;
