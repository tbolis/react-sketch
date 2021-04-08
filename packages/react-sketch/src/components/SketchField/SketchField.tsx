import * as React from "react";
// import { useRef, useState } from "react";

interface SketchProperties {
  tool: string;
}

const SketchField = (props: SketchProperties) => {
  // const _canvas = useRef(null);
  // const _container = useRef(null);

  // const { className, style, width, height } = props;

  // const [sketchState, setSketchState] = useState({
  //   action: true,
  // });
  //
  // const canvasDivStyle = Object.assign(
  //   {},
  //   style ? style : {},
  //   width ? { width: width } : {},
  //   height ? { height: height } : { height: 512 }
  // );

  return (
    <div>
      TOM!!!
      <canvas>
        Sorry, Canvas HTML5 element is not supported by your browser :(
      </canvas>
    </div>
  );
};

export default SketchField;
