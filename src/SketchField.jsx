'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const fabric = require('fabric').fabric;

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends React.Component {

    constructor(props, context) {
        super(props, context);
        this._resize = this._resize.bind(this);
        this.state = {
            parentWidth: 1
        };
    }

    componentDidMount() {
        this._fc = new fabric.Canvas(this._canvas.id, {
            isDrawingMode: true
        });
        window.addEventListener('resize', this._resize, false);
        let width = ReactDOM.findDOMNode(this).offsetWidth;
        this.setState({parentWidth: width});
        this._fc.setWidth(width);
        this._fc.calcOffset();
    }

    componentWillUnmount = () => window.removeEventListener('resize', this._resize);

    /**
     * Track the resize of the window and update our state
     *
     * @param event the resize event
     * @private
     */
    _resize(event) {
        if (event) {
            event.preventDefault()
        }
        let canvas = this._fc;
        let domNode = ReactDOM.findDOMNode(this);
        let width = domNode.offsetWidth;
        let prevWidth = canvas.getWidth();
        let factor = width / prevWidth;
        canvas.setWidth(width);
        if (canvas.backgroundImage) {
            // Need to scale background images as well
            let bi = canvas.backgroundImage;
            bi.width = bi.width * factor;
            bi.height = bi.height * factor;
        }
        let objects = canvas.getObjects();
        for (let i in objects) {
            let obj = objects[i];

            let scaleX = obj.scaleX;
            let scaleY = obj.scaleY;
            let left = obj.left;
            let top = obj.top;

            let tempScaleX = scaleX * factor;
            let tempScaleY = scaleY * factor;
            let tempLeft = left * factor;
            let tempTop = top * factor;

            obj.scaleX = tempScaleX;
            obj.scaleY = tempScaleY;
            obj.left = tempLeft;
            obj.top = tempTop;

            obj.setCoords();
        }
        canvas.renderAll();
        canvas.calcOffset();
    }

    /**
     * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
     */
    undo() {
        //let history = this._history;
        //// we do not want the latest canvas but the one before  that
        //if (history.canUndo()) {
        //    let ctx = this._ctx;
        //    let canvas = this._canvas;
        //    if (ctx) {
        //        ctx.beginPath();
        //        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //        let image = new Image();
        //        let undoCanvas = history.undo();
        //        image.src = undoCanvas;
        //        ctx.drawImage(image, 0, 0);
        //        ctx.stroke();
        //        ctx.closePath();
        //        this.setState({
        //            content: undoCanvas
        //        });
        //        if (this.props.onChange) {
        //            this.props.onChange(event, undoCanvas);
        //        }
        //    }
        //}
    }

    /**
     * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
     */
    redo() {
        //let history = this._history;
        //if (history.canRedo()) {
        //    let ctx = this._ctx;
        //    let canvas = this._canvas;
        //    if (ctx) {
        //        ctx.beginPath();
        //        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //        let image = new Image();
        //        let redoCanvas = history.redo();
        //        image.src = redoCanvas;
        //        ctx.drawImage(image, 0, 0);
        //        ctx.stroke();
        //        ctx.closePath();
        //        this.setState({
        //            content: redoCanvas
        //        });
        //        // there is no direct on change event
        //        if (this.props.onChange) {
        //            this.props.onChange(event, redoCanvas);
        //        }
        //    }
        //}
    }

    /**
     * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
     *
     * @returns {*} true if we can undo otherwise false
     */
    canUndo() {
        return this._history.canUndo();
    }

    /**
     * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
     *
     * @returns {*} true if we can redo otherwise false
     */
    canRedo() {
        return this._history.canRedo();
    }

    /**
     * Get the current content from Canvas
     *
     * @returns {null} the data of the canvas
     */
    getContent() {
        return this.state.content;
    }

    /**
     * Set the content of Canvas to the given one
     *
     * @param drawing the content to set to the canvas
     */
    setContent(drawing) {
        var image = new Image();
        image.src = drawing;
        this._ctx.drawImage(image, 0, 0);
        this._ctx.stroke();
        this._history.keep(drawing);
        this.setState({content: drawing});
    }

    /**
     * Clear the content of the canvas, this will also keep the last version of it to history
     */
    clear() {

    }

    render() {
        let {
            className,
            disabled,
            style,
            onChange,
            width,
            height,
            ...other
            } = this.props;
        return (
            <div className={className} style={style}>
                <canvas id={new Date().getTime() +''}
                        ref={(c) => this._canvas = c}
                        width={width || this.state.parentWidth}
                        height={height || 512}>
                    Canvas is not supported by your browser :(
                </canvas>
            </div>
        )
    }
}

export default SketchField;