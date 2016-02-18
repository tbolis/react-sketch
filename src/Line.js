import CanvasTool from './CanvasTool'
import {mousePosition} from './utils';

class Line extends CanvasTool {

    doMouseDown(event) {
        let [_x, _y] = mousePosition(event);
        // store initial position of mouse
        [this._startX, this._startY] = [_x, _y];
        [this._x, this._y] = [_x, _y];
        // Start Drawing
        this._background = this._canvas.toDataURL();
        this._isMouseDown = true;
    }

    doMouseMove(event) {
        let [_startX,_startY] = [this._startX, this._startY];
        let [_currX, _currY] = mousePosition(event);
        if (this._isMouseDown) {
            this._ctx.beginPath();
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            if (this._background) {
                var image = new Image();
                image.src = this._background;
                this._ctx.drawImage(image, 0, 0);
            }
            this._ctx.moveTo(_startX, _startY);
            this._ctx.lineTo(_currX, _currY);
            this._ctx.stroke();
            this._ctx.closePath();
        }
        [this._x, this._y] = [_currX, _currY];
    }

    doMouseUp(event) {
        this._isMouseDown = false;
        this._background = null;
    }

    doMouseOut(event) {
        this._isMouseDown = false;
    }
}

export default Line;