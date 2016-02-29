import CanvasTool from './CanvasTool'
import {pointerPosition} from './utils';

class Rectangle extends CanvasTool {

    doMouseUp(event) {
        this._isMouseDown = false;
        this._background = null;
    }

    doMouseDown(event) {
        let [_x, _y] = pointerPosition(event);
        // store initial position of mouse
        [this._startX, this._startY] = [_x, _y];
        [this._x, this._y] = [_x, _y];
        // Start Drawing
        this._background = this._canvas.toDataURL();
        this._isMouseDown = true;
    }

    doMouseMove(event) {
        let [_startX,_startY] = [this._startX, this._startY];
        let [_currX, _currY] = pointerPosition(event);
        if (this._isMouseDown) {
            this._ctx.beginPath();
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            if (this._background) {
                var image = new Image();
                image.src = this._background;
                this._ctx.drawImage(image, 0, 0);
            }
            this._ctx.strokeRect(_startX, _startY, _currX - _startX, _currY - _startY);
            this._ctx.fillRect(_startX, _startY, _currX - _startX, _currY - _startY);
            this._ctx.closePath();
        }
        [this._x, this._y] = [_currX, _currY];
    }
}

export default Rectangle;