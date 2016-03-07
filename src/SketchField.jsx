'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import Line from './Line';
import Tool from './Tools'
import Pencil from './Pencil';
import History from './History';
import Circle from './Circle';
import Rectangle from './Rectangle';

/**
 * Sketch Tool for React Applications
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
        imageFormat: React.PropTypes.string
    };

    static defaultProps = {
        color: 'black',
        fill: 'transparent',
        lineWidth: 2,
        undoSteps: 15,
        tool: Tool.Pencil,
        imageFormat: 'image/png'
    };

    constructor(props, context) {
        super(props, context);
        this._mouseUp = this._mouseUp.bind(this);
        this._mouseDown = this._mouseDown.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._mouseOut = this._mouseOut.bind(this);
        this._resize = this._resize.bind(this);
        this.state = {
            parentWidth: 1,
            content: null
        }
    }

    componentDidMount() {
        // Assign the events to canvas element
        this._canvas.addEventListener('mouseup', this._mouseUp, false);
        this._canvas.addEventListener('touchend', this._mouseUp, false);

        this._canvas.addEventListener('mousedown', this._mouseDown, false);
        this._canvas.addEventListener('touchstart', this._mouseDown, false);

        this._canvas.addEventListener('mousemove', this._mouseMove, false);
        this._canvas.addEventListener('touchmove', this._mouseMove, false);

        this._canvas.addEventListener('mouseout', this._mouseOut);

        // Handle the resize of Canvas
        this._canvas.width = ReactDOM.findDOMNode(this).offsetWidth;
        window.addEventListener('resize', this._resize, false);
        // Create context
        this._ctx = this._canvas.getContext('2d');
        // config
        this._configure(this.props);
        // Initialize History
        this._history = new History(this.props.undoSteps);
        // Initialize the tools
        this._tools = {};
        this._tools[Tool.Circle] = new Circle(this._canvas, this._ctx);
        this._tools[Tool.Line] = new Line(this._canvas, this._ctx);
        this._tools[Tool.Pencil] = new Pencil(this._canvas, this._ctx);
        this._tools[Tool.Rectangle] = new Rectangle(this._canvas, this._ctx);
    }

    componentWillReceiveProps(props) {
        if (props.value && props.value !== this.state.content) {
            this.setContent(props.value);
        }
    }

    componentWillUnmount = () => window.removeEventListener('resize', this._resize);

    componentWillUpdate = (props, state) => this._configure(props);

    /**
     * Configure the canvas drawing (color,fill, line width etc.)
     *
     * @param config the configuration to use
     * @private
     */
    _configure(config) {
        if (!config) return;

        let ctx = this._ctx;
        if ('color' in config) {
            ctx.strokeStyle = config.color;
        }
        if ('lineWidth' in config) {
            ctx.lineWidth = config.lineWidth;
        }
        if ('fill' in config) {
            ctx.fillStyle = config.fill;
        }
    }

    /**
     * Track the resize of the window and update our state
     *
     * @param event the resize event
     * @private
     */
    _resize(event) {
        let self = this;
        let data = self._canvas.toDataURL();
        this.setState({
            parentWidth: ReactDOM.findDOMNode(this).offsetWidth
        }, () => {
            let img = new Image();
            img.onload = function () {
                self._ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, self._canvas.width, self._canvas.height);
            };
            img.src = data;
        });
    }

    /**
     * Mouse up event of canvas assigned as listener
     *
     * @param event the event
     * @private
     */
    _mouseUp(event) {
        if (event) event.preventDefault();
        // Call corresponding tool action
        let tool = this._tools[this.props.tool || Tool.Pencil];
        tool.doMouseUp(event);
        // store latest canvas context to history
        let drawing = this._canvas.toDataURL(this.props.imageFormat);
        this._history.keep(drawing);
        // Keep content
        this.setState({content: drawing});
        // there is no direct on change event
        if (this.props.onChange) {
            this.props.onChange(event, drawing);
        }
    }

    /**
     * The mouse move event of the canvas assigned as listener
     *
     * @param event the mouse move event
     * @private
     */
    _mouseMove(event) {
        if (event) event.preventDefault();
        let tool = this._tools[this.props.tool || Tool.Pencil];
        tool.doMouseMove(event);
    }

    /**
     * The mouse down event assigned to canvas
     *
     * @param event the corresponding event
     * @private
     */
    _mouseDown(event) {
        if (event) event.preventDefault();
        let tool = this._tools[this.props.tool || Tool.Pencil];
        tool.doMouseDown(event);
    }

    /**
     * The mouse out event assigned to canvas
     *
     * @param event the corresponding event
     * @private
     */
    _mouseOut(event) {
        if (event) event.preventDefault();
        let tool = this._tools[this.props.tool || Tool.Pencil];
        tool.doMouseOut(event);
        // there is no direct on change event
        let content = this._canvas.toDataURL(this.props.imageFormat);
        this.setState({
            content: content
        });
        if (this.props.onChange) {
            this.props.onChange(event, content);
        }
    }

    /**
     * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
     */
    undo() {
        let history = this._history;
        // we do not want the latest canvas but the one before  that
        if (history.canUndo()) {
            let ctx = this._ctx;
            let canvas = this._canvas;
            if (ctx) {
                ctx.beginPath();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let image = new Image();
                let undoCanvas = history.undo();
                image.src = undoCanvas;
                ctx.drawImage(image, 0, 0);
                ctx.stroke();
                ctx.closePath();
                this.setState({
                    content: undoCanvas
                });
                if (this.props.onChange) {
                    this.props.onChange(event, undoCanvas);
                }
            }
        }
    }

    /**
     * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
     */
    redo() {
        let history = this._history;
        if (history.canRedo()) {
            let ctx = this._ctx;
            let canvas = this._canvas;
            if (ctx) {
                ctx.beginPath();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let image = new Image();
                let redoCanvas = history.redo();
                image.src = redoCanvas;
                ctx.drawImage(image, 0, 0);
                ctx.stroke();
                ctx.closePath();
                this.setState({
                    content: redoCanvas
                });
                // there is no direct on change event
                if (this.props.onChange) {
                    this.props.onChange(event, redoCanvas);
                }
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
        let ctx = this._ctx;
        let canvas = this._canvas;
        let history = this._history;
        if (ctx) {
            // keep last canvas first
            history.keep(this._canvas.toDataURL(this.props.imageFormat));
            // clear canvas
            ctx.beginPath();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.stroke();
            ctx.closePath();
        }
        this.setState({content: null});
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
                    ref={(c) => this._canvas = c}
                    width={width || this.state.parentWidth}
                    height={height || '512px'}> Sorry, Canvas element is not supported
                </canvas>
            </div>
        )
    }
}

export default SketchField;