'use strict';

import React from 'react';
import History from './History';
import ReactDOM from 'react-dom';
const fabric = require('fabric').fabric;

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends React.Component {

    static propTypes = {
        // the color of the line
        color: React.PropTypes.string,
        // the fill color of the shape when applicable
        fill: React.PropTypes.string,
        // The width of the line
        lineWidth: React.PropTypes.number,
        // number of undo/redo steps to maintain
        undoSteps: React.PropTypes.number,
        // The tool to use, can be pencil, rectangle, circle, brush;
        tool: React.PropTypes.string,
        // image format when calling toDataURL
        imageFormat: React.PropTypes.string,
        //enable/disable drawing mode
        drawingMode: React.PropTypes.bool
    };

    static defaultProps = {
        color: 'black',
        fill: 'transparent',
        lineWidth: 2,
        undoSteps: 10,
        drawingMode: true
    };

    constructor(props, context) {
        super(props, context);
        this._resize = this._resize.bind(this);
        this.state = {
            parentWidth: 1
        };
    }

    componentDidMount() {
        let canvas = new fabric.Canvas(this._canvas.id, {
            isDrawingMode: this.props.drawingMode
        });

        let {freeDrawingBrush} = canvas;
        freeDrawingBrush.width = parseInt(this.props.lineWidth, 10) || 1;
        freeDrawingBrush.color = this.props.color;

        this._fc = canvas;
        window.addEventListener('resize', this._resize, false);
        let width = ReactDOM.findDOMNode(this).offsetWidth;
        this.setState({
            parentWidth: width
        }, () => {
            canvas.setWidth(width);
            canvas.calcOffset();

        });
        // Initialize History
        this._history = new History(this.props.undoSteps);

        canvas.on('object:added', (e) => {
            let obj = e.target;
            this._history.keep(obj);
        });
        canvas.on('object:modified', (e) => {
            let obj = e.target;
            this._history.keep(obj);
        });
    }

    componentWillUnmount = () => window.removeEventListener('resize', this._resize);

    componentWillReceiveProps(props) {
        // mess with drawing mode
        let canvas = this._fc;
        if (this.props.drawingMode !== props.drawingMode) {
            canvas.isDrawingMode = props.drawingMode;
        }
        // mess with width of line
        if (canvas.freeDrawingBrush) {
            if (this.props.lineWidth !== props.lineWidth) {
                canvas.freeDrawingBrush.width = parseInt(props.lineWidth, 10) || 1;
            }
            if (this.props.color !== props.color) {
                canvas.freeDrawingBrush.color = props.color || 'black';
            }

        }
    }

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
     * Clear the content of the canvas, this will also keep the last version of it to history
     */
    clear() {
        this._fc.clear()
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
                <canvas
                    id={'c' + new Date().getTime()} ref={(c) => this._canvas = c}
                    width={width || this.state.parentWidth} height={height || 512}>
                    Canvas is not supported by your browser :(
                </canvas>
            </div>
        )
    }
}

export default SketchField;