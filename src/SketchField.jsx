 /*eslint no-unused-vars: 0*/

import React, {PureComponent, useEffect} from 'react';
import PropTypes from 'prop-types';

import History from './history';

import {uuid4} from './utils';
import Select from './select';
import Pencil from './pencil';
import Line from './line';
import Arrow from './arrow';
import Rectangle from './rectangle';
import Circle from './circle';
import Pan from './pan';
import Tool from './tools';

const fabric = require('fabric').fabric;

/**
 * Sketch Tool based on FabricJS for React Applications
 */

class SketchField extends PureComponent {

  static propTypes = {
    // the color of the line
    lineColor: PropTypes.string,
    // The width of the line
    lineWidth: PropTypes.number,
    // the fill color of the shape when applicable
    fillColor: PropTypes.string,
    // the background color of the sketch
    backgroundColor: PropTypes.string,
    // the opacity of the object
    opacity: PropTypes.number,
    // number of undo/redo steps to maintain
    undoSteps: PropTypes.number,
    // The tool to use, can be pencil, rectangle, circle, brush;
    tool: PropTypes.string,
    // image format when calling toDataURL
    imageFormat: PropTypes.string,
    // Sketch data for controlling sketch from
    // outside the component
    value: PropTypes.object,
    // Set to true if you wish to force load the given value, even if it is  the same
    forceValue: PropTypes.bool,
    // Specify some width correction which will be applied on auto resize
    widthCorrection: PropTypes.number,
    // Specify some height correction which will be applied on auto resize
    heightCorrection: PropTypes.number,
    // Specify action on change
    onChange: PropTypes.func,
    // Default initial value
    defaultValue: PropTypes.object,
    // Sketch width
    width: PropTypes.number,
    // Sketch height
    height: PropTypes.number,
    // Class name to pass to container div of canvas
    className: PropTypes.string,
    // Style options to pass to container div of canvas
    style: PropTypes.object,
  };



  static defaultProps = {
    lineColor: 'black',
    lineWidth: 10,
    fillColor: 'transparent',
    backgroundColor: 'transparent',
    opacity: 1.0,
    undoSteps: 25,
    tool: Tool.Circle,
    widthCorrection: 2,
    heightCorrection: 0,
    forceValue: false
  };

  state = {
    parentWidth: 550,
    action: true,
    save: null,
  };

  _initTools = (fabricCanvas) => {
    this._tools = {};
    this._tools[Tool.Select] = new Select(fabricCanvas);
    this._tools[Tool.Pencil] = new Pencil(fabricCanvas);
    this._tools[Tool.Line] = new Line(fabricCanvas);
    this._tools[Tool.Arrow] = new Arrow(fabricCanvas);
    this._tools[Tool.Rectangle] = new Rectangle(fabricCanvas);
    this._tools[Tool.Circle] = new Circle(fabricCanvas);
    this._tools[Tool.Pan] = new Pan(fabricCanvas)
  };

  /**
   * Enable touch Scrolling on Canvas
   */
  enableTouchScroll = () => {
    let canvas = this._fc;
    if (canvas.allowTouchScrolling) return;
    canvas.allowTouchScrolling = true
  };

  /**
   * Disable touch Scrolling on Canvas
   */
  disableTouchScroll = () => {
    let canvas = this._fc;
    if (canvas.allowTouchScrolling) {
      canvas.allowTouchScrolling = false
    }
  };

  /**
   * Add an image as object to the canvas
   *
   * @param dataUrl the image url or Data Url
   * @param options object to pass and change some options when loading image, the format of the object is:
   *
   * {
   *   left: <Number: distance from left of canvas>,
   *   top: <Number: distance from top of canvas>,
   *   scale: <Number: initial scale of image>
   * }
   */
  addImg = (dataUrl, options = {}) => {

    let canvas = this._fc;

    fabric.Image.fromURL(dataUrl, (oImg) => {
      let opts = {
        left: Math.random() * (canvas.getWidth() - oImg.width * 0.5),
        top: Math.random() * (canvas.getHeight() - oImg.height * 0.5),
        scale: 0.5
      };
      Object.assign(opts, options);
      oImg.scale(opts.scale);
      oImg.set({
        'left': opts.left,
        'top': opts.top
      });
      canvas.add(oImg);
    });
  };

  /**
   * Action when an object is added to the canvas
   */
  _onObjectAdded = (e) => {
    if (!this.state.action) {
      this.setState({ action: true });
      return
    }
    let obj = e.target;
    obj.__version = 1;
    // record current object state as json and save as originalState
    let objState = obj.toJSON();
    obj.__originalState = objState;
    let state = JSON.stringify(objState);
    // object, previous state, current state
    this._history.keep([obj, state, state])
  };

  /**
   * Action when an object is moving around inside the canvas
   */
  _onObjectMoving = (e) => {

  };

  /**
   * Action when an object is scaling inside the canvas
   */
  _onObjectScaling = (e) => {

  };

  /**
   * Action when an object is rotating inside the canvas
   */
  _onObjectRotating = (e) => {

  };

  _onObjectModified = (e) => {
    let obj = e.target;
    obj.__version += 1;

    let prevState = JSON.stringify(obj.__originalState);
    let objState = obj.toJSON();

    obj.__originalState = objState;
    let currState = JSON.stringify(objState);

    this._history.keep([obj, prevState, currState]);
  };

  /**
   * Action when an object is removed from the canvas
   */
  _onObjectRemoved = (e) => {
    let obj = e.target;
    if (obj.__removed) {
      obj.__version += 1;
      return
    }
    obj.__version = 0;
  };

  /**
   * Action when the mouse button is pressed down
   */
  _onMouseDown = (e) => {
    this._selectedTool.doMouseDown(e);
  };

  /**
   * Action when the mouse cursor is moving around within the canvas
   */
  _onMouseMove = (e) => {
    this._selectedTool.doMouseMove(e);
  };

  /**
   * Action when the mouse cursor is moving out from the canvas
   */
  _onMouseOut = (e) => {
    this._selectedTool.doMouseOut(e);
    if (this.props.onChange) {
      let onChange = this.props.onChange;
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
  };

  _onMouseUp = (e) => {
    this._selectedTool.doMouseUp(e);
    // Update the final state to new-generated object

    if (this.props.tool !== Tool.Pencil) {
      const canvas = this._fc;
      const objects = canvas.getObjects();
      const newObj = objects[objects.length - 1];
      if (newObj && newObj.__version === 1) {
        newObj.__originalState = newObj.toJSON();
      }
    }
    if (this.props.onChange) {
      let onChange = this.props.onChange;
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
  };

  /**
   * Track the resize of the window and update our state
   *
   * @param e the resize event
   * @private
   */
  _resize = (e) => {
    if (e) e.preventDefault();
    let { widthCorrection, heightCorrection } = this.props;
    let canvas = this._fc;
    let { offsetWidth, clientHeight } = this._container;
    let prevWidth = canvas.getWidth();
    let prevHeight = canvas.getHeight();
    let wfactor = ((offsetWidth - widthCorrection) / prevWidth).toFixed(2);
    let hfactor = ((clientHeight - heightCorrection) / prevHeight).toFixed(2);
    canvas.setWidth(offsetWidth - widthCorrection);
    canvas.setHeight(clientHeight - heightCorrection);
    if (canvas.backgroundImage) {
      // Need to scale background images as well
      let bi = canvas.backgroundImage;
      bi.width = bi.width * wfactor;
      bi.height = bi.height * hfactor
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
      obj.setCoords()
    }
    this.setState({
      parentWidth: offsetWidth
    });
    canvas.renderAll();
    canvas.calcOffset();
  };

  _canvansSize = () =>{
    let canvas = this._fc;
    console.log(canvas);
    canvas.height = 500;
    canvas.renderAll()
    console.log(canvas)
  }

  /**
   * Sets the background color for this sketch
   * @param color in rgba or hex format
   */
  _backgroundColor = (color) => {
    if (!color) return;
    let canvas = this._fc;
    canvas.setBackgroundColor(color, () => canvas.renderAll())
  };

  /**
   * Zoom the drawing by the factor specified
   *
   * The zoom factor is a percentage with regards the original, for example if factor is set to 2
   * it will double the size whereas if it is set to 0.5 it will half the size
   *
   * @param factor the zoom factor
   */
  zoom = (factor) => {
    let canvas = this._fc;
    let objects = canvas.getObjects();


    for (let i in objects) {
      objects[i].scaleX = objects[i].scaleX * factor;
      objects[i].scaleY = objects[i].scaleY * factor;
      objects[i].left = objects[i].left * factor;
      objects[i].top = objects[i].top * factor;
      objects[i].setCoords();
    }
    canvas.renderAll();
    canvas.calcOffset();
  };

  /**
   * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
   */
  undo = () => {
    let history = this._history;
    let [obj, prevState, currState] = history.getCurrent();
    history.undo();
    if (obj.__removed) {
      this.setState({ action: false }, () => {
        this._fc.add(obj);
        obj.__version -= 1;
        obj.__removed = false;
      });
    } else if (obj.__version <= 1) {
      this._fc.remove(obj);
    } else {
      obj.__version -= 1;
      obj.setOptions(JSON.parse(prevState));
      obj.setCoords();
      this._fc.renderAll()
    }
    if (this.props.onChange) {
      this.props.onChange()
    }
  };

  /**
   * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
   */
  redo = () => {

    let history = this._history;
    if (history.canRedo()) {
      let canvas = this._fc;
      let [obj, prevState, currState] = history.redo();
      if (obj.__version === 0) {
        this.setState({ action: false }, () => {
          canvas.add(obj);
          obj.__version = 1
        })
      } else {
        obj.__version += 1;
        obj.setOptions(JSON.parse(currState))
      }
      obj.setCoords();
      canvas.renderAll();
      if (this.props.onChange) {
        this.props.onChange()
      }
    }
  };

  /**
   * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
   *
   * @returns {*} true if we can undo otherwise false
   */
  canUndo = () => {
    return this._history.canUndo()
  };

  /**
   * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
   *
   * @returns {*} true if we can redo otherwise false
   */
  canRedo = () => {
    return this._history.canRedo()
  };

  toDataURL = (options) => {
    this._fc.toDataURL(options);
  }

  toJSON = (propertiesToInclude) => this._fc.toJSON(propertiesToInclude);

  fromJSON = (json) => {
    var canvas = this._fc;
    if (!json) return;
    //setTimeout(() => {
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        if (this.props.onChange) {
         //  this.props.onChange()
        }
      })
  //  }, 100)

  };

  clear = (propertiesToInclude) => {
    let discarded = this.toJSON(propertiesToInclude);
    this._fc.clear();
    this._history.clear();
    return discarded
  };

  removeSelected = () => {
    let canvas = this._fc;
    let activeObj = canvas.getActiveObject();
    if (activeObj) {
      let selected = [];
      if (activeObj.type === 'activeSelection') {
        activeObj.forEachObject(obj => selected.push(obj));
      } else {
        selected.push(activeObj)
      }
      selected.forEach(obj => {
        obj.__removed = true;
        let objState = obj.toJSON();
        obj.__originalState = objState;
        let state = JSON.stringify(objState);
        this._history.keep([obj, state, state]);
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  copy = () => {
    let canvas = this._fc;
  };

  paste = () => {
    // clone again, so you can do multiple copies.
    this._clipboard.clone(clonedObj => {
      let canvas = this._fc;
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        // active selection needs a reference to the canvas.
        clonedObj.canvas = canvas;
        clonedObj.forEachObject(obj => canvas.add(obj));
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      this._clipboard.top += 10;
      this._clipboard.left += 10;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  };

  /**
   * Sets the background from the dataUrl given
   *
   * @param dataUrl the dataUrl to be used as a background
   * @param options
   */
  setBackgroundFromDataUrl = (dataUrl, options = {}) => {
    let canvas = this._fc;
    if (options.stretched) {
      delete options.stretched;
      Object.assign(options, {
        width: canvas.width ,
        height: canvas.height
      })
    }
    if (options.stretchedX) {
      delete options.stretchedX;
      Object.assign(options, {
        width: canvas.width
      })
    }
    if (options.stretchedY) {
      delete options.stretchedY;
      Object.assign(options, {
        height: canvas.height
      })
    }
    let img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => canvas.setBackgroundImage(new fabric.Image(img),
      () => canvas.renderAll(), options);
    img.src = dataUrl
  };

  changeBackground = (imgData) =>{
      let canvas = this._fc;
      setTimeout(() => {
      var img = new Image();
      img.onload = function() {
          // this is syncronous
          var f_img = new fabric.Image(img);
          canvas.setBackgroundImage(f_img);
          canvas.renderAll();
      };
      img.src = imgData;
    }, 3000)
  }

  addText = (text, options = {}) => {
    let canvas = this._fc;
    let iText = new fabric.IText(text, options);

    let opts = {
      left: (canvas.getWidth() - iText.width) * 0.5,
      top: (canvas.getHeight() - iText.height) * 0.5,
    };
    Object.assign(options, opts);

    iText.set({
      'left': options.left,
      'top': options.top
    });

    canvas.add(iText);
  };

  componentDidMount = () => {
    let {  tool,  value, undoSteps, defaultValue, backgroundColor } = this.props;
    let canvas = this._fc = new fabric.Canvas(this._canvas);
    this._initTools(canvas);
    this._backgroundColor(backgroundColor)
    let selectedTool = this._tools[tool];

    selectedTool.configureCanvas(this.props);
    this._selectedTool = selectedTool;
    window.addEventListener('resize', this._resize, false);
    window.addEventListener('keydown', this.deleteKey, false)
    
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
    canvas.on('object:moving', this._onObjectMoving);
    canvas.on('object:scaling', this._onObjectScaling);
    canvas.on('object:rotating', this._onObjectRotating);


    this.disableTouchScroll();
    this._resize();
    (value || defaultValue) && this.fromJSON(value || defaultValue);
  };


  componentWillUnmount = () =>  {
    window.removeEventListener('resize', this._resize); 
    window.removeEventListener('keydown', this.deleteKey, false)
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.state.parentWidth !== prevState.parentWidth
      || this.props.width !== prevProps.width
      || this.props.height !== prevProps.height) {

      this._resize()
    }
    if (this.props.tool !== prevProps.tool) {
      this._selectedTool = this._tools[this.props.tool] || this._tools[Tool.Pencil]
    }
    //Bring the cursor back to default if it is changed by a tool
    this._fc.defaultCursor = 'default';
    this._selectedTool.configureCanvas(this.props);

    if (this.props.backgroundColor !== prevProps.backgroundColor) {
      this._backgroundColor(this.props.backgroundColor)
    }

    if ((this.props.value !== prevProps.value) || (this.props.value && this.props.forceValue)) {
      this.fromJSON(this.props.value);
    }
  };

  /**
  * Delete key Commands for selection deleted.
  * @event params
  */
  deleteKey = (event) =>{
     if(event.code == "Delete" || event.code == "BackSpace"){
       this.props.removeItem()
     }
   }

   /**
   * Download Content
   */
   download = () => {
     var url = null;
     if(this._fc.backgroundImage){
       url = this._fc.backgroundImage._element.src;
     }
     let hash = {  height: this._fc.height, width: this._fc.width,
        backgroundColor: this._fc.backgroundColor, viewportTransform:  this._fc.viewportTransform,
        backImg: url,
     }
     this._history.saveToFile(hash);
   }


  render = () => {
    let { className,  style, width, height } = this.props;
    console.log(height);
    console.log(width);

    let canvasDivStyle = Object.assign({}, style ? style : {},
      width ? { width: width } : {},
      height ? { height: height } : { height: 512 });
    return (
          <div
            className={className}
            ref={(c) => this._container = c}
            style={canvasDivStyle}>
            <canvas
              id={uuid4()}
              ref={(c) => this._canvas = c}>
                Sorry, Canvas HTML5 element is not supported by your browser
              :(
            </canvas>
          </div>
    )
  }
}

export default SketchField
