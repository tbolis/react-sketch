import CanvasTool from './CanvasTool'
import {pointerPosition} from './utils';

class Pencil extends CanvasTool {

    doMouseUp(event) {
        this._isMouseDown = false;
    }

    doMouseDown(event) {
        let [_x, _y] = pointerPosition(event);
        // store initial position of mouse
        [this._startX, this._startY] = [_x, _y];
        [this._x, this._y] = [_x, _y];
        // Start Drawing
        this._isMouseDown = true;
    }

    doMouseMove(event) {
        let [_prevX,_prevY] = [this._x, this._y];
        let [_currX, _currY] = pointerPosition(event);
        if (this._isMouseDown) {
            this._ctx.beginPath();
            this._ctx.moveTo(_prevX, _prevY);
            this._ctx.lineTo(_currX, _currY);
            this._ctx.stroke();
            this._ctx.closePath();
        }
        [this._x, this._y] = [_currX, _currY];
    }

    doMouseOut(event) {
        this._isMouseDown = false;
    }
}

export default Pencil;