/*eslint no-unused-vars: 0*/

import FabricCanvasTool from './fabrictool'

const fabric = require('fabric').fabric;

class RectangleLabel extends FabricCanvasTool {

  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    canvas.forEachObject((o) => o.selectable = o.evented = false);
    this._width = props.lineWidth;
    this._color = props.lineColor;
    this._fill = props.fillColor;
    this._maxFontSize = 12;
  }

  doMouseDown(o) {
    let canvas = this._canvas;
    this.isDown = true;
    let pointer = canvas.getPointer(o.e);
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.rect = new fabric.Rect({
      left: this.startX,
      top: this.startY,
      originX: 'left',
      originY: 'top',
      width: pointer.x - this.startX,
      height: pointer.y - this.startY,
      stroke: this._color,
      strokeWidth: this._width,
      fill: this._fill,
      transparentCorners: false,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache : false,
      angle: 0
    });

    this.text = new fabric.Text("New defect",{
      left: this.startX,
      top: this.startY - 12,
      originX: 'left',
      originY: 'top',
      width: pointer.x - this.startX - this._width + 1,
      height: canvas.height/3,
      fontSize: this._maxFontSize,
      backgroundColor: this._color,
      borderColor: this._color,
      angle: 0
    });

    while (this.text.height >  canvas.height/3) {
      this.text.set({fontSize: this.text.fontSize-1,top: this.startY - this.text.fontSize - 12,});
    }

    canvas.add(this.rect);
    canvas.add(this.text);
  }

  doMouseMove(o) {
    if (!this.isDown) return;
    let canvas = this._canvas;
    let pointer = canvas.getPointer(o.e);
    if (this.startX > pointer.x) {
      this.rect.set({ left: Math.abs(pointer.x) });
      this.text.set({ left: Math.abs(pointer.x) });
    }
    if (this.startY > pointer.y) {
      this.rect.set({ left: Math.abs(pointer.x) });
      this.text.set({ top: Math.abs(pointer.y) });
    }
    this.text.set({ width: Math.abs(this.startX - pointer.x - this._width + 1) });
    this.text.setCoords();
    this.rect.set({ width: Math.abs(this.startX - pointer.x) });
    this.rect.set({ height: Math.abs(this.startY - pointer.y) });
    this.rect.setCoords();
    canvas.renderAll();
  }

  doMouseUp(o) {
    this.isDown = false;
    let canvas = this._canvas;
    
    var group = new fabric.Group([this.rect,this.text]);
    canvas.remove(this.rect);
    canvas.remove(this.text);
    canvas.add(group);
    canvas.renderAll();
  }
}

export default RectangleLabel;

