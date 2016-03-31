import FabricCanvasTool from './fabrictool'
import {pointerPosition} from './utils';

class Select extends FabricCanvasTool {

    configureCanvas(props) {
        console.log('Select Tool');
        this._canvas.isDrawingMode = false;
        this._canvas.selection = true;
    }
}

export default Select