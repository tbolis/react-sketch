/**
 * "Abstract" like base class for a Canvas tool
 */
class CanvasTool {
    constructor(canvas, ctx) {
        this._canvas = canvas;
        this._ctx = ctx;
    }

    doMouseUp(event) {

    }

    doMouseDown(event) {

    }

    doMouseMove(event) {

    }

    doMouseOut(event) {

    }
}

export default CanvasTool;