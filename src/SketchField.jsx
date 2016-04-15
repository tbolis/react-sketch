/*eslint no-unused-vars: 0*/
'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import History from './history';
import {uuid4} from './utils';

import Select from './select'
import Pencil from './pencil'
import Line from './line'
import Rectangle from './rectangle'
import Circle from './circle'
import Tool from './tools'

const fabric = require('fabric').fabric;

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends React.Component {

    static propTypes = {
        // the color of the line
        lineColor: React.PropTypes.string,
        // The width of the line
        lineWidth: React.PropTypes.number,
        // the fill color of the shape when applicable
        fillColor: React.PropTypes.string,
        // the opacity of the object
        opacity: React.PropTypes.number,
        // number of undo/redo steps to maintain
        undoSteps: React.PropTypes.number,
        // The tool to use, can be pencil, rectangle, circle, brush;
        tool: React.PropTypes.string,
        // image format when calling toDataURL
        imageFormat: React.PropTypes.string,
        // Scale the drawing when we resize the canvas
        scaleOnResize: React.PropTypes.bool,
        // Default initial data
        defaultData: React.PropTypes.object,
        // Type of initial data
        defaultDataType: React.PropTypes.oneOf(['json', 'url'])
    };

    static defaultProps = {
        lineColor: 'black',
        lineWidth: 1,
        fillColor: 'transparent',
        opacity: 1.0,
        undoSteps: 15,
        scaleOnResize: true,
        tool: Tool.Pencil,
        defaultDataType: 'json'
    };

    constructor(props, context) {
        super(props, context);
        this._resize = this._resize.bind(this);
        this._initTools = this._initTools.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onObjectAdded = this._onObjectAdded.bind(this);
        this._onObjectRemoved = this._onObjectRemoved.bind(this);
        this._onObjectModified = this._onObjectModified.bind(this);
        this.state = {
            parentWidth: 10,
            action: true
        };
    }

    componentDidMount() {
        let {tool,
            undoSteps,
            defaultData,
            defaultDataType} = this.props;

        let canvas = this._fc = new fabric.Canvas(this._canvas.id);
        this._initTools(canvas);

        let selectedTool = this._tools[tool];
        selectedTool.configureCanvas(this.props);

        // Control resize
        window.addEventListener('resize', this._resize, false);
        this._resize(null);

        // Initialize History, with maximum number of undo steps
        this._history = new History(undoSteps);

        // Events binding
        canvas.on('object:added', this._onObjectAdded);
        canvas.on('object:modified', this._onObjectModified);
        canvas.on('object:removed', this._onObjectRemoved);
        canvas.on('mouse:down', this._onMouseDown);
        canvas.on('mouse:move', this._onMouseMove);
        canvas.on('mouse:up', this._onMouseUp);
        canvas.on('mouse:out', this._onMouseOut);

        // initialize canvas with default data
        setTimeout(() => {
            if (defaultData) {
                if ('json' === defaultDataType) {
                    this.fromJson(defaultData);
                }
                if ('url' === defaultDataType) {
                    this.fromDataURL(defaultData);
                }
            }
        }, 100)
    }

    _initTools(fabricCanvas) {
        this._tools = {};
        this._tools[Tool.Select] = new Select(fabricCanvas);
        this._tools[Tool.Pencil] = new Pencil(fabricCanvas);
        this._tools[Tool.Line] = new Line(fabricCanvas);
        this._tools[Tool.Rectangle] = new Rectangle(fabricCanvas);
        this._tools[Tool.Circle] = new Circle(fabricCanvas);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._resize);
    }

    componentWillReceiveProps(props) {
        let tool = this._tools[props.tool] || this._tools['pencil'];
        tool.configureCanvas(props);
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
        obj.version = 0;
    }

    _onMouseDown(e) {
        let tool = this._tools[this.props.tool];
        if (tool) {
            tool.doMouseDown(e);
        }
    }

    _onMouseMove(e) {
        let tool = this._tools[this.props.tool];
        if (tool) {
            tool.doMouseMove(e);
        }
    }

    _onMouseUp(e) {
        let tool = this._tools[this.props.tool];
        if (tool) {
            tool.doMouseUp(e);
        }
        if (this.props.onChange) {
            this.props.onChange(event.e);
        }
    }

    _onMouseOut(e) {
        let tool = this._tools[this.props.tool];
        if (tool) {
            tool.doMouseOut(e);
        }
        if (this.props.onChange) {
            this.props.onChange(event.e);
        }
    }

    /**
     * Track the resize of the window and update our state
     *
     * @param e the resize event
     * @private
     */
    _resize(e) {
        if (e) {
            e.preventDefault()
        }
        // if disabled then do not perform the resize
        if (!this.props.scaleOnResize) return;
        let canvas = this._fc;
        let domNode = ReactDOM.findDOMNode(this);
        let width = domNode.offsetWidth;
        let height = domNode.clientHeight;
        let prevWidth = canvas.getWidth();
        let prevHeight = canvas.getHeight();
        let wfactor = (width / prevWidth).toFixed(2);
        let hfactor = (height / prevHeight).toFixed(2);
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
        this.setState({
            parentWidth: width
        });
        canvas.renderAll();
        canvas.calcOffset();
    }

    /**
     * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
     */
    undo() {
        let history = this._history;
        let [obj,prevState,currState] = history.getCurrent();
        history.undo();
        if (obj.version === 1) {
            obj.remove();
        } else {
            obj.setOptions(JSON.parse(prevState));
            obj.setCoords();
            obj.version -= 1;
            this._fc.renderAll();
        }
        if (this.props.onChange) {
            this.props.onChange(event.e);
        }
    }

    /**
     * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
     */
    redo() {
        let history = this._history;
        if (history.canRedo()) {
            let canvas = this._fc;
            //noinspection Eslint
            let [obj,prevState,currState] = history.redo();
            if (obj.version === 0) {
                this.setState({action: false}, () => {
                    canvas.add(obj);
                    obj.version = 1;
                });
            } else {
                obj.version += 1;
                obj.setOptions(JSON.parse(currState));
            }
            obj.setCoords();
            canvas.renderAll();
            if (this.props.onChange) {
                this.props.onChange(event.e);
            }
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
     * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
     *
     * Available Options are
     * <table style="width:100%">
     *
     * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Argument</b></td><td><b>Default</b></td><td><b>Description</b></td></tr>
     * <tr><td>format</td> <td>String</td> <td><optional></td><td>png</td><td>The format of the output image. Either "jpeg" or "png"</td></tr>
     * <tr><td>quality</td><td>Number</td><td><optional></td><td>1</td><td>Quality level (0..1). Only used for jpeg.</td></tr>
     * <tr><td>multiplier</td><td>Number</td><td><optional></td><td>1</td><td>Multiplier to scale by</td></tr>
     * <tr><td>left</td><td>Number</td><td><optional></td><td></td><td>Cropping left offset. Introduced in v1.2.14</td></tr>
     * <tr><td>top</td><td>Number</td><td><optional></td><td></td><td>Cropping top offset. Introduced in v1.2.14</td></tr>
     * <tr><td>width</td><td>Number</td><td><optional></td><td></td><td>Cropping width. Introduced in v1.2.14</td></tr>
     * <tr><td>height</td><td>Number</td><td><optional></td><td></td><td>Cropping height. Introduced in v1.2.14</td></tr>
     *
     * </table>
     *
     * @returns {String} URL containing a representation of the object in the format specified by options.format
     */
    toDataURL(options) {
        return this._fc.toDataURL(options);
    }

    /**
     * Returns JSON representation of canvas
     *
     * @param propertiesToInclude Array    <optional>
     Any properties that you might want to additionally include in the output
     * @returns {string} JSON string
     */
    toJSON(propertiesToInclude) {
        return this._fc.toJSON(propertiesToInclude);
    }

    /**
     * Populates canvas with data from the specified JSON.
     *
     * JSON format must conform to the one of fabric.Canvas#toDatalessJSON
     *
     * @param json JSON string or object
     * @param callback Callback, invoked when json is parsed and corresponding objects (e.g: fabric.Image) are initialized
     * @param reviver Method for further parsing of JSON elements, called after each fabric object created.

     */
    fromJson(json) {
        if (!json) return;
        let canvas = this._fc;
        canvas.loadFromJSON(json, () => canvas.renderAll());
        if (this.props.onChange) {
            this.props.onChange(null);
        }
    }

    /**
     * This method will create an image and load the given url data
     *
     * @param data URL data to load as image
     * @param options options to be applied to image <optional>
     */
    fromDataURL(data, options = {}) {
        if (!data) return;
        let canvas = this._fc;
        let img = new Image();
        img.src = data;
        img.onload = () => canvas.add(new fabric.Image(img, options));
        if (this.props.onChange) {
            this.props.onChange(null);
        }
    }

    /**
     * Clear the content of the canvas, this will also keep the last version of it to history
     */
    clear() {
        this._fc.clear();
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
                    id={uuid4()}
                    height={height || 512}
                    ref={(c) => this._canvas = c}
                    width={width || this.state.parentWidth}>
                    Sorry, Canvas HTML5 element is not supported by your browser :(
                </canvas>
            </div>
        )
    }
}

export default SketchField;