/*eslint no-unused-vars: 0*/
'use strict';

import FabricCanvasTool from './fabrictool'

class Select extends FabricCanvasTool {

    configureCanvas(props) {
        let canvas = this._canvas;
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.forEachObject((o) => {
            o.selectable = o.evented = true;
        });
    }
}

export default Select