import CanvasTool from './CanvasTool'
import {pointerPosition, linearDistance} from './utils';

class Circle extends CanvasTool {

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
            this._ctx.arc(_currX, _currY,
                linearDistance({x: _startX, y: _startY}, {x: _currX, y: _currY}), 0, 2 * Math.PI, false);
            this._ctx.fill();
            this._ctx.stroke();
            this._ctx.closePath();
        }
        [this._x, this._y] = [_currX, _currY];
    }
}

export default Circle;