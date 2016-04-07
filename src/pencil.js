'use strict';

import FabricCanvasTool from './fabrictool'

class Pencil extends FabricCanvasTool {

    configureCanvas(props) {
        this._canvas.isDrawingMode = true;
        // Initial line configuration
        let {freeDrawingBrush} = this._canvas;
        freeDrawingBrush.width = props.lineWidth;
        freeDrawingBrush.color = props.lineColor;
    }
}

export default Pencil;