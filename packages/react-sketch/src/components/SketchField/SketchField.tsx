import * as React from "react";
import { useRef, useState } from "react";

interface SketchProperties {
  lineColor: string;
  tool: string;
  value: string;
  undoSteps: number;
  defaultValue: string;
  backgroundColor: string;
  className: string;
  style: string;
  width: number;
  height: number;
}

const SketchField = (props: SketchProperties) => {
  const _canvas = useRef(null);
  const _container = useRef(null);

  const { className, style, width, height } = props;

  const [sketchState, setSketchState] = useState({
    action: true,
  });

  const canvasDivStyle = Object.assign(
    {},
    style ? style : {},
    width ? { width: width } : {},
    height ? { height: height } : { height: 512 }
  );

  return (
    <div className={className} ref={_container} style={canvasDivStyle}>
      <canvas ref={_canvas}>
        Sorry, Canvas HTML5 element is not supported by your browser :(
      </canvas>
    </div>
  );
};

export default SketchField;
