/*eslint no-unused-vars: 0*/

import FabricCanvasTool from './fabrictool'

const fabric = require('fabric').fabric;

class Text extends FabricCanvasTool {
  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    canvas.forEachObject((o) => o.selectable = o.evented = false);
    this._size = props.textSize;
    this._color = props.textColor;
  }

  doMouseDown(o) {
    let canvas = this._canvas;
    this.isDown = true;
    let pointer = canvas.getPointer(o.e);
    [this.startX, this.startY] = [pointer.x, pointer.y];
    this.text = new fabric.IText("",{
      left: this.startX,
      top: this.startY,
    });
    this.text.set({
      fill: this._color,
      fontSize: this._size,
    })
    canvas.add(this.text);
    canvas.setActiveObject(this.text);
    this.text.enterEditing();
    this.text.hiddenTextarea.focus();
  }

  doMouseUp(o) {
    this.isDown = false;
  }
}

export default Text;