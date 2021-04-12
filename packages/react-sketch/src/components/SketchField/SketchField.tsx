import * as React from "react";
import { PureComponent } from "react";
import PropTypes from "prop-types";
import { SketchProperties, SketchState } from "./types";

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends PureComponent<SketchProperties, SketchState> {
  private canvas: HTMLCanvasElement | null;
  private container: HTMLDivElement | null;

  constructor(props: SketchProperties) {
    super(props);
    this.canvas = null;
    this.container = null;
  }

  static propTypes = {
    lineColor: PropTypes.string,
  };

  static defaultProps = {
    lineColor: "black",
  };

  state = {
    action: true,
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
        // style={canvasDivStyle}
        ref={(c) => (this.container = c)}
      >
        <canvas ref={(c) => (this.canvas = c)}>
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    );
  };
}

export default SketchField;
