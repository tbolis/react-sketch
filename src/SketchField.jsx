'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const fabric = require('fabric').fabric;

import History from './History';
import {uuid4} from './utils';


/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends React.Component {

    static propTypes = {
        // the color of the line
        lineColor: React.PropTypes.string,
        // the fill color of the shape when applicable
        fillColor: React.PropTypes.string,
        // The width of the line
        lineWidth: React.PropTypes.number,
        // number of undo/redo steps to maintain
        undoSteps: React.PropTypes.number,
        // The tool to use, can be pencil, rectangle, circle, brush;
        tool: React.PropTypes.string,
        // image format when calling toDataURL
        imageFormat: React.PropTypes.string,
        //enable/disable drawing mode
        drawingMode: React.PropTypes.bool,
        // Scale the drawing when we resize the canvas
        scaleOnResize: React.PropTypes.bool
    };

    static defaultProps = {
        lineColor: 'black',
        fillColor: 'transparent',
        lineWidth: 1,
        undoSteps: 10,
        drawingMode: true,
        scaleOnResize: true
    };

    constructor(props, context) {
        super(props, context);
        this._resize = this._resize.bind(this);
        this._onObjectAdded = this._onObjectAdded.bind(this);
        this._onObjectModified = this._onObjectModified.bind(this);
        this._onObjectRemoved = this._onObjectRemoved.bind(this);
        this.state = {
            parentWidth: 10,
            action: true
        };
    }

    componentDidMount() {
        let canvas = new fabric.Canvas(this._canvas.id, {
            isDrawingMode: this.props.drawingMode
        });
        this._fc = canvas;
        // Initial line configuration
        let {freeDrawingBrush} = canvas;
        freeDrawingBrush.width = this.props.lineWidth;
        freeDrawingBrush.color = this.props.lineColor;
        // Control resize
        window.addEventListener('resize', this._resize, false);
        this._resize(null);
        //// Initialize History, with maximum number of undo steps
        this._history = new History(this.props.undoSteps);
        canvas.on('object:added', this._onObjectAdded);
        canvas.on('object:modified', this._onObjectModified);
        canvas.on('object:removed', this._onObjectRemoved);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._resize);
    }

    componentWillReceiveProps(props) {
        // mess with drawing mode
        let canvas = this._fc;
        if (this.props.drawingMode !== props.drawingMode) {
            canvas.isDrawingMode = props.drawingMode;
        }
        // mess with line options
        let {freeDrawingBrush} = canvas;
        if (freeDrawingBrush) {
            let {lineWidth,lineColor} = this.props;
            if (lineWidth !== props.lineWidth) {
                freeDrawingBrush.width = props.lineWidth;
            }
            if (lineColor !== props.lineColor) {
                freeDrawingBrush.color = props.lineColor || 'black';
            }
        }
    }

    _onObjectAdded(e) {
        if (!this.state.action) {
            this.setState({action: true});
            return;
        }
        let obj = e.target;
        obj.version = 1;
        let state = JSON.stringify(obj.originalState);
        // object, previous state, current state
        this._history.keep([obj, state, state]);
    }

    _onObjectModified(e) {
        let obj = e.target;
        obj.version += 1;
        let prevState = JSON.stringify(obj.originalState);
        obj.saveState();
        let currState = JSON.stringify(obj.originalState);
        this._history.keep([obj, prevState, currState]);
    }

    _onObjectRemoved(e) {
        let obj = e.target;
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
        // if disabled then do not perform the resize
        if (!this.props.scaleOnResize) return;
        let canvas = this._fc;
        let domNode = ReactDOM.findDOMNode(this);
        let width = domNode.offsetWidth;
        let height = domNode.offsetHeight;
        let prevWidth = canvas.getWidth();
        let prevHeight = canvas.getHeight();
        let wfactor = width / prevWidth;
        let hfactor = height / prevHeight;
        canvas.setWidth(width);
        canvas.setHeight(height);
        if (canvas.backgroundImage) {
            // Need to scale background images as well
            let bi = canvas.backgroundImage;
            bi.width = bi.width * wfactor;
            bi.height = bi.height * hfactor;
        }
        let objects = canvas.getObjects();
        for (let i in objects) {
            let obj = objects[i];
            let scaleX = obj.scaleX;
            let scaleY = obj.scaleY;
            let left = obj.left;
            let top = obj.top;
            let tempScaleX = scaleX * wfactor;
            let tempScaleY = scaleY * hfactor;
            let tempLeft = left * wfactor;
            let tempTop = top * hfactor;
            obj.scaleX = tempScaleX;
            obj.scaleY = tempScaleY;
            obj.left = tempLeft;
            obj.top = tempTop;
            obj.setCoords();
        }
        canvas.renderAll();
        canvas.calcOffset();
        this.setState({
            parentWidth: width,
            parentHeight: height
        });
    }

    /**
     * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
     */
    undo() {
        let history = this._history;
        // we do not want the latest canvas but the one before  that
        if (history.canUndo()) {
            let [obj,prevState,currState] = history.undo();
            if (obj.version === 1) obj.remove();
            else {
                obj.setOptions(JSON.parse(prevState));
                obj.setCoords();
                obj.version -= 1;
            }
            this._fc.renderAll();
        }
    }

    /**
     * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
     */
    redo() {
        let history = this._history;
        if (history.canRedo()) {
            let canvas = this._fc;
            let [obj,prevState,currState] = history.redo();
            obj.setOptions(JSON.parse(currState));
            if (obj.version === 1) {
                this.setState({action: false}, ()=> {
                    canvas.add(obj);
                });
            } else {
                obj.setCoords();
                obj.version += 1;
            }
            canvas.renderAll();
        }
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
            <div className={className} style={style} ref={(c) => this._canvasWrapper = c}>
                <canvas
                    id={uuid4()}
                    height={height || 512}
                    ref={(c) => this._canvas = c}>
                    width={width || this.state.parentWidth}
                    Sorry, Canvas HTML5 element is not supported by your browser :(
                </canvas>
            </div>
        )
    }
}

export default SketchField;