import FabricCanvasTool from './fabrictool'
import {pointerPosition} from './utils';

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