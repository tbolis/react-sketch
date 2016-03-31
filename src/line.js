import FabricCanvasTool from './fabrictool'
import {pointerPosition} from './utils';

const fabric = require('fabric').fabric;

class Line extends FabricCanvasTool {

    configureCanvas(props) {
        this._canvas.isDrawingMode = this._canvas.selection = false;
        this._width = props.lineWidth;
        this._color = props.lineColor;
    }

    doMouseDown(o) {
        this.isDown = true;
        let canvas = this._canvas;
        var pointer = canvas.getPointer(o.e);
        var points = [pointer.x, pointer.y, pointer.x, pointer.y];
        this.line = new fabric.Line(points, {
            strokeWidth: this._width,
            fill: this._color,
            stroke: this._color,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(this.line);
    }

    doMouseMove(o) {
        if (!this.isDown) return;
        let canvas = this._canvas;
        var pointer = canvas.getPointer(o.e);
        this.line.set({x2: pointer.x, y2: pointer.y});
        canvas.renderAll();
    }

    doMouseUp(event) {
        this.isDown = false;
    }

    doMouseOut(event) {
        this.isDown = false;
    }
}

export default Line;