/*eslint no-unused-vars: 0*/

import FabricCanvasTool from './fabrictool'

const fabric = require('fabric').fabric;

class Arrow extends FabricCanvasTool {

  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    canvas.forEachObject((o) => o.selectable = o.evented = false);
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
      originY: 'center',
      selectable: false,
      evented: false
    });
    canvas.add(this.line);
  }

  doMouseMove(o) {
    if (!this.isDown) return;
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    this.line.set({ x2: pointer.x, y2: pointer.y });
    this.line.setCoords();
    canvas.renderAll();
  }

  doMouseUp(o) {
    this.isDown = false;
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    let x_delta = this.line.x2 - this.line.x1;
    let y_delta = this.line.y2 - this.line.y1;

    let head = new fabric.Triangle({
      fill: this._color,
      left: pointer.x,
      top: pointer.y,
      originX: 'center',
      originY: 'center',
      height: 3 * this._width,
      width: 3 * this._width,
      selectable: false,
      evented: false,
      angle: 90 + Math.atan2(y_delta, x_delta) * 180/Math.PI,
    });
    canvas.remove(this.line);
    let arrow = new fabric.Group([this.line, head]);
    canvas.add(arrow);
  }

  doMouseOut(o) {
    this.isDown = false;
  }
}

export default Arrow;