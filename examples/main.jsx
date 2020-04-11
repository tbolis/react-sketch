/*eslint no-unused-vars: 0, no-console: 0*/

import React from 'react';
import {CompactPicker} from 'react-color';
import 'flexboxgrid';
import './main.css';
import AppBar from '@material-ui/core/AppBar';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import ExpandMore from '@material-ui/icons/ExpandMore';
import CardHeader from '@material-ui/core/CardHeader';
import GridListTile from '@material-ui/core/GridListTile';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/lab/Slider';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Collapse from '@material-ui/core/Collapse';
import {createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import color from '@material-ui/core/colors/blueGrey';

import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import ClearIcon from '@material-ui/icons/Clear';
import AddIcon from '@material-ui/icons/Add';
import CopyIcon from '@material-ui/icons/FileCopy';
import RemoveIcon from '@material-ui/icons/Remove';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import UploadIcon from '@material-ui/icons/Backup';

import dataJson from './data.json';
import dataJsonControlled from './data.json.controlled';
import {SketchField, Tools} from '../src';
import dataUrl from './data.url';
import DropZone from 'react-dropzone';
import Toolbar from '@material-ui/core/Toolbar/Toolbar';
import Typography from '@material-ui/core/Typography/Typography';

import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';


const styles = {
  root: {
    padding: '3px',
    display: 'flex',
    flexWrap: 'wrap',
    margin: '10px 10px 5px 10px',
    justifyContent: 'space-around',
  },
  gridList: {
    width: '100%',
    overflowY: 'auto',
    marginBottom: '24px',
  },
  gridTile: {
    backgroundColor: '#fcfcfc',
  },
  appBar: {
    backgroundColor: '#333',
  },
  radioButton: {
    marginTop: '3px',
    marginBottom: '3px',
  },
  separator: {
    height: '42px',
    backgroundColor: 'white',
  },
  iconButton: {
    fill: 'white',
    width: '42px',
    height: '42px',
  },
  dropArea: {
    width: '100%',
    height: '64px',
    border: '2px dashed rgb(102, 102, 102)',
    borderStyle: 'dashed',
    borderRadius: '5px',
    textAlign: 'center',
    paddingTop: '20px',
  },
  activeStyle: {
    borderStyle: 'solid',
    backgroundColor: '#eee',
  },
  rejectStyle: {
    borderStyle: 'solid',
    backgroundColor: '#ffdddd',
  },
  card: {
    margin: '10px 10px 5px 0'
  },
  modal: {
    top: '40%',
    left: '50%',
    transform: 'translate(50%, 50%)'
  }
};

/**
 * Helper function to manually fire an event
 *
 * @param el the element
 * @param etype the event type
 */
function eventFire(el, etype) {

  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}




class SketchFieldDemo extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      lineWidth: 10,
      lineColor: 'black',
      fillColor: '#68CCCA',
      backgroundColor: 'transparent',
      shadowWidth: 0,
      shadowOffset: 0,
      tool: Tools.Select,
      enableRemoveSelected: true,
      fillWithColor: false,
      fillWithBackgroundColor: false,
      drawings: [],
      canUndo: false,
      canRedo: false,
      controlledSize: false,
      sketchWidth: (window.innerWidth - 400),
      sketchHeight: (window.innerHeight - 200),
      stretched: true,
      stretchedX: false,
      stretchedY: false,
      originX: 'left',
      originY: 'top',
      imageUrl: 'https://files.gamebanana.com/img/ico/sprays/4ea2f4dad8d6f.png',
      expandTools: false,
      expandControls: false,
      expandColors: false,
      expandBack: false,
      expandImages: false,
      expandControlled: false,
      text: 'Testing!',
      enableCopyPaste: false,
      isOpen: true,
      dataJson: dataJson,
      url: dataUrl,
      maxHeight: (window.innerHeight + 800),
      isOpen: true
    };
  }

  _selectTool = event => {
    this.setState({
      tool: event.target.value,
      enableRemoveSelected: event.target.value === Tools.Select,
      enableCopyPaste: event.target.value === Tools.Select
    });
  };

  _save = () => {
    var array = []
    let canvas =  this._sketch._fc;
    var stObject =  canvas._objects;
    for (var key in stObject) {
      var obArray = []
      var orgState = stObject[key].__originalState;
      if(orgState){
        if(orgState.objects){
          for(var j = 0; j < orgState.objects.length; j++){
            var newHash =  this._getHash(orgState.objects[j]);
            obArray.push(newHash);
          }
        }
        var hash = this._getHash(stObject[key].__originalState, obArray);
        array.push(hash)
      }
    }

    var objects = {   "objects": array , background: canvas.backgroundColor  }

    if(canvas.backgroundImage){
      var url = canvas.backgroundImage._element.src;
      this.setState({url: url})
    }

    this.setState({isOpen: true , objects: objects});
  };

  _open = () => {
      this._sketch.changeBackground(this.state.url)
      if(this.state.objects.objects.length > 0){
        this._sketch.fromJSON(this.state.objects);
      }
  }

  _download = () => {
    this._sketch.download();
  };


 _getHash = (obj, obArray) => {

      var hash = {
                  type: obj.type,
                  originX: obj.originX,
                  originY: obj.originY,
                  left: obj.left,
                  top: obj.top,
                  width: obj.width,
                  height: obj.height,
                  fill: obj.fill,
                  stroke: obj.stroke,
                  strokeWidth: obj.strokeWidth,
                  strokeDashArray: obj.strokeDashArray,
                  strokeLineCap: obj.strokeLineCap,
                  strokeLineJoin: obj.strokeLineJoin,
                  strokeMiterLimit: obj.strokeMiterLimit,
                  scaleX: obj.scaleX,
                  scaleY: obj.scaleY,
                  angle: obj.angle,
                  flipX: obj.flipX,
                  flipY: obj.flipY,
                  opacity: obj.opacity,
                  shadow: obj.shadow,
                  visible: obj.visible,
                  clipTo: obj.clipTo,
                  backgroundColor: obj.backgroundColor,
                  fillRule: obj.fillRule,
                  paintFirst: obj.paintFirst,
                  globalCompositeOperation: obj.globalCompositeOperation,
                  transformMatrix: obj.transformMatrix,
                  skewX: obj.skewX,
                  skewY: obj.skewY,
                  path: obj.path,
                  x1: obj.x1,
                  x2: obj.x2,
                  y1: obj.y1,
                  y2: obj.y2,
                  objects: obArray,
                  radius: obj.radius,
                  startAngle: obj.startAngle,
                  endAngle: obj.endAngle,
                  text:  obj.text,
                  fontSize: obj.fontSize,
                  fontWeight: obj.fontWeight,
                  fontFamily: obj.fontFamily,
                  fontStyle: obj.fontStyle,
                  lineHeight: obj.lineHeight,
                  underline: obj.underline,
                  overline: obj.overline,
                  linethrough: obj.linethrough,
                  textAlign: obj.textAlign,
                  textBackgroundColor: obj.textBackgroundColor,
                  charSpacing: obj.charSpacing,
                  crossOrigin: "",
                  cropX: obj.cropX,
                  cropY: obj.cropY,
                  src: obj.src,
                }
               return hash;
 }

  _renderTile = (drawing, index) => {
    return (
      <GridListTile
        key={index}
        title="Canvas Image"
        actionPosition="left"
        titlePosition="top"
        titleBackground="linear-gradient(to bottom, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)"
        cols={1}
        rows={1}
        style={styles.gridTile}
        actionIcon={
          <IconButton onTouchTap={c => this._removeMe(index)}>
            <ClearIcon color="white"/>
          </IconButton>
        }>
        <img src={drawing}/>
      </GridListTile>
    );
  };

  _removeMe = index => {
    let drawings = this.state.drawings;
    drawings.splice(index, 1);
    this.setState({ drawings: drawings });
  };

  _undo = () => {
    this._sketch.undo();
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
    });
  };

  _redo = () => {
    this._sketch.redo();
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
    });
  };

  _clear = () => {
    this._sketch.clear();
    this._sketch.setBackgroundFromDataUrl('');
    this.setState({
      controlledValue: null,
      backgroundColor: 'transparent',
      fillWithBackgroundColor: false,
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
    });
  };

  _removeSelected = () => {
    this._sketch.removeSelected()
  };

  _onSketchChange = () => {
    let prev = this.state.canUndo;
    let now = this._sketch.canUndo();
    if (prev !== now) {
      this.setState({ canUndo: now });
    }
  };

  _onBackgroundImageDrop = (accepted) => {
    if (accepted && accepted.length > 0) {
      let sketch = this._sketch;
      let reader = new FileReader();

      let { stretched, stretchedX, stretchedY, originX, originY } = this.state;
      reader.addEventListener(
        'load',
        () => sketch.setBackgroundFromDataUrl(reader.result, {
            stretched: stretched,
            stretchedX: stretchedX,
            stretchedY: stretchedY,
            originX: originX,
            originY: originY,
          }),

        false,
      );
      reader.readAsDataURL(accepted[0]);
    }
  };

  _addText = () => this._sketch.addText(this.state.text);

  _readFile = (event) => {

      this._clear();
      let file = event.target.files[0];

      if(file){
          let reader = new FileReader();
          reader.addEventListener(
            'load',
            () => this._loadData(reader.result),  false,
          );
          reader.readAsText(file);
      }
  }

  _loadData = (data) =>{
      data = JSON.parse(data);
      this.setState({height: data.height, width: data.width})
      let sketch = this._sketch;
      sketch.fromJSON(data);
      sketch._backgroundColor(data.backgroundColor);
      if(data.backImg){
        sketch.changeBackground(data.backImg)
      }
  }

  componentDidMount = () => {
    (function(console) {
      console.save = function(data, filename) {

        if (!data) {
          return;
        }
        if (!filename) filename = 'console.json';
        if (typeof data === 'object') {
          data = JSON.stringify(data, undefined, 4);
        }
        var blob = new Blob([data], { type: 'text/json' }),
          e = document.createEvent('MouseEvents'),
          a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
      };
    })(console);

  };

  _handleClose = () =>{
      this.setState({isOpen: false})
  }

  _setInput1 = (event) =>{
    this.setState({newHeight: event.target.value})
  }
  _setInput2 = (event) =>{
    this.setState({newWidth: event.target.value})
  }

  _saveClick = () =>{

      if(this.state.newWidth && this.state.newHeight){
        this.setState({ height: parseInt(this.state.newHeight), width: parseInt(this.state.newWidth)})
      }
      this.setState({isOpen: false})
      console.log(this.state.height)
  }

  render = () => {
    let { controlledValue } = this.state;
    const theme = createMuiTheme({
      typography: {
        useNextVariants: true,
      },
      palette: {
        primary: { main: color[500] }, // Purple and green play nicely together.
        secondary: { main: '#11cb5f' }, // This is just green.A700 as hex.
      },
    });


    return (
      <MuiThemeProvider theme={theme}>
        <div className="row">
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">

            <AppBar position="static" style={styles.appBar}>
              <Toolbar>
                <Typography variant="h6" color="inherit" style={{ flexGrow: 1 }}>Sketch Tool</Typography>

                <IconButton
                  color="primary"
                  title="Open"
                  disabled={!this.state.isOpen}
                  onClick={this._open}>
                  <AddIcon/>
                </IconButton>

                <IconButton
                  color="primary"
                  title="Undo"
                  disabled={!this.state.canUndo}
                  onClick={this._undo}>
                  <UndoIcon/>
                </IconButton>
                <IconButton
                  color="primary"
                  title="Redo"
                  disabled={!this.state.canRedo}
                  onClick={this._redo}>
                  <RedoIcon/>
                </IconButton>
                <IconButton
                  color="primary"
                  title="Save"
                  onClick={this._save}>
                  <SaveIcon/>
                </IconButton>

                <Button
                      style={{background: 'none', border: 'none', color: '#607d8b', boxShadow: 'none'}}
                      variant="contained"
                      component="label"
                      title="Upload"  >
                      <UploadIcon />
                      <input   type="file"
                        onChange={(e) => this._readFile(e)}
                        style={{ display: "none" }}  />
                </Button>
                <IconButton
                  color="primary"
                  title="Download"
                  onClick={this._download}>
                  <DownloadIcon/>
                </IconButton>

                <IconButton
                  color="primary"
                  title="Delete All"
                  onClick={this._clear}>
                  <DeleteIcon/>
                </IconButton>
              </Toolbar>
            </AppBar>
          </div>
        </div>

        <div className="row">
              <Modal
                  open={this.state.isOpen}
                  onClose={() => this._handleClose()}
                  aria-labelledby="simple-modal-title"
                  aria-describedby="simple-modal-description">
                  <div className="row" style={{ background: '#fff', width: '30%', position: 'absolute', top: '25%', left: '25%', height: 300}}>
                    <div className="text-center" style={{ textAlign: 'center', width: '100%', height: '0px'}}>
                      <h2> Select Size</h2>
                    </div>

                    <div className="col-md-4">
                        <label> Height </label>
                        <input type="text" value={this.state.height} onChange={this._setInput1} style={{ padding: 10, marginTop: 5}}/>
                    </div>
                    <div className="col-md-2"></div>

                    <div className="col-md-4">
                        <label> Width </label>
                        <input type="text" value={this.state.width} onChange={this._setInput2} style={{ padding: 10, marginTop: 5}}/>
                    </div>

                    <div className="col-md-12" style={{ textAlign: 'center', marginTop: 0}}>
                      <Button variant="contained" color="primary" onClick={this._saveClick}>
                          Save
                      </Button>
                    </div>
                  </div>
              </Modal>
        </div>

        <div className="row">
          <div className="col-xs-7 col-sm-7 col-md-9 col-lg-9">
            <SketchField
              name="sketch"
              className="canvas-area"
              ref={c => (this._sketch = c)}
              lineColor={this.state.lineColor}
              lineWidth={this.state.lineWidth}
              removeItem={this._removeSelected}
              fillColor={
                this.state.fillWithColor
                  ? this.state.fillColor
                  : 'transparent'
              }
              backgroundColor={
                this.state.fillWithBackgroundColor
                  ? this.state.backgroundColor
                  : 'transparent'
              }
              width={
                this.state.controlledSize ? this.state.sketchWidth : this.state.width
              }
              height={
                this.state.controlledSize ? this.state.sketchHeight : this.state.height
              }
              defaultValue={this.state.dataJson}
              value={controlledValue}
              forceValue
              onChange={this._onSketchChange}
              tool={this.state.tool}
            />
          </div>

          <div className="col-xs-5 col-sm-5 col-md-3 col-lg-3">
            <Card style={styles.card}>
              <CardHeader
                title="Tools"
                subheader="Available tools"
                action={
                  <IconButton
                    onClick={(e) => this.setState({ expandTools: !this.state.expandTools })}>
                    <ExpandMore/>
                  </IconButton>
                }/>
              <Collapse in={this.state.expandTools}>
                <CardContent>
                  <div className="row">
                    <div className="col-lg-12">
                      <TextField
                        select={true}
                        label="Canvas Tool"
                        value={this.state.tool}
                        onChange={this._selectTool}
                        helperText="Please select Canvas Tool">
                        <MenuItem value={Tools.Select} key="Select">Select</MenuItem>
                        <MenuItem value={Tools.Pencil} key="Pencil">Pencil</MenuItem>
                        <MenuItem value={Tools.Line} key="Line">Line</MenuItem>
                        <MenuItem value={Tools.Arrow} key="Arrow">Arrow</MenuItem>
                        <MenuItem value={Tools.Rectangle} key="Rectangle">Rectangle</MenuItem>
                        <MenuItem value={Tools.Circle} key="Circle">Circle</MenuItem>
                        <MenuItem value={Tools.Pan} key="Pan">Pan</MenuItem>
                      </TextField>
                    </div>
                  </div>
                  <br/>
                  <br/>
                  <Typography id="slider">Line Weight</Typography>
                  <Slider
                    step={1} min={0} max={100}
                    aria-labelledby="slider"
                    value={this.state.lineWidth}
                    onChange={(e, v) =>
                      this.setState({ lineWidth: v })
                    }
                  />
                  <br/>
                  <label htmlFor="zoom">Zoom</label>
                  <div>
                    <IconButton
                      onClick={(e) => this._sketch.zoom(1.25)}>
                      <ZoomInIcon/>
                    </IconButton>
                    <IconButton
                      onClick={(e) => this._sketch.zoom(0.8)}>
                      <ZoomOutIcon/>
                    </IconButton>
                  </div>
                  <div className="row">
                    <div className="col-lg-7">
                      <TextField
                        label='Text'
                        helperText='Add text to Sketch'
                        onChange={(e) => this.setState({ text: e.target.value })}
                        value={this.state.text}/>
                    </div>
                    <div className="col-lg-3">
                      <IconButton
                        color="primary"
                        onClick={this._addText}>
                        <AddIcon/>
                      </IconButton>
                    </div>
                  </div>
                </CardContent>
              </Collapse>
            </Card>
            <Card style={styles.card}>
              <CardHeader
                title="Controls"
                subheader="Copy/Paste etc."
                action={
                  <IconButton
                    onClick={(e) => this.setState({ expandControls: !this.state.expandControls })}>
                    <ExpandMore/>
                  </IconButton>
                }/>
              <Collapse in={this.state.expandControls}>
                <CardContent>
                  <div className="row">
                    <div className="col-lg-12">
                      <FormControlLabel
                        control={
                          <Switch
                            value={this.state.controlledSize}
                            onChange={(e) => this.setState({ controlledSize: !this.state.controlledSize })}
                          />
                        }
                        label="Control size"
                      />
                      <br/>
                      <Typography id="xSize">Change Canvas Width</Typography>
                      <Slider
                        step={1}
                        min={10}
                        max={1000}
                        value={this.state.sketchWidth}
                        onChange={(e, v) => this.setState({ sketchWidth: v })}/>
                      <br/>
                      <Typography id="ySize">Change Canvas Height</Typography>
                      <Slider
                        step={1}
                        min={10}
                        max={1000}
                        value={this.state.sketchHeight}
                        onChange={(e, v) => this.setState({ sketchHeight: v })}/>
                      <br/>
                    </div>
                  </div>
                  <label htmlFor="zoom">Selection Actions (Select an object first!)</label>
                  <div className="row">
                    <div className="col">
                      <IconButton
                        color="primary"
                        disabled={!this.state.enableCopyPaste}
                        onClick={(e) => {
                          this._sketch.copy();
                          this._sketch.paste();
                        }}>
                        <CopyIcon/>
                      </IconButton>
                    </div>
                    <div className="col">
                      <IconButton
                        color="primary"
                        disabled={!this.state.enableRemoveSelected}
                        onClick={this._removeSelected}>
                        <RemoveIcon/>
                      </IconButton>
                    </div>
                  </div>
                </CardContent>
              </Collapse>
            </Card>
            <Card style={styles.card}>
              <CardHeader
                title="Colors"
                subheader="Put some color on your drawing"
                action={
                  <IconButton
                    onClick={(e) => this.setState({ expandColors: !this.state.expandColors })}>
                    <ExpandMore/>
                  </IconButton>
                }/>
              <Collapse in={this.state.expandColors}>
                <CardContent>
                  <label htmlFor='lineColor'>Line</label>
                  <br/>
                  <CompactPicker
                    id='lineColor' color={this.state.lineColor}
                    onChange={(color) => this.setState({ lineColor: color.hex })}/>
                  <br/>
                  <br/>
                  <FormControlLabel
                    control={
                      <Switch
                        value={this.state.fillWithColor}
                        onChange={(e) => this.setState({ fillWithColor: !this.state.fillWithColor })}/>
                    }
                    label="Fill"
                  />
                  <CompactPicker
                    color={this.state.fillColor}
                    onChange={(color) => this.setState({ fillColor: color.hex })}/>
                </CardContent>
              </Collapse>
            </Card>
            <Card style={styles.card}>
              <CardHeader
                title="Background"
                subheader="Background of drawing"
                action={
                  <IconButton
                    onClick={(e) => this.setState({ expandBack: !this.state.expandBack })}>
                    <ExpandMore/>
                  </IconButton>
                }/>
              <Collapse in={this.state.expandBack}>
                <CardContent>
                  <FormControlLabel
                    label="Background Color"
                    control={
                      <Switch
                        value={this.state.fillWithBackgroundColor}
                        onChange={(e) => this.setState({
                          fillWithBackgroundColor: !this.state.fillWithBackgroundColor
                        })}/>
                    }/>
                  <CompactPicker
                    color={this.state.backgroundColor}
                    onChange={(color) => this.setState({ backgroundColor: color.hex })}/>
                  <br/>
                  <br/>
                  <label htmlFor='lineColor'>Set Image Background</label>
                  <br/>
                  <FormControlLabel
                    label="Fit canvas (X,Y)"
                    control={
                      <Switch
                        value={this.state.stretched}
                        onChange={(e) => this.setState({ stretched: !this.state.stretched })}/>
                    }/>
                  <FormControlLabel
                    label="Fit canvas (X)"
                    control={
                      <Switch
                        value={this.state.stretchedX}
                        onChange={(e) => this.setState({ stretchedX: !this.state.stretchedX })}/>
                    }/>
                  <FormControlLabel
                    label="Fit canvas (Y)"
                    control={
                      <Switch
                        value={this.state.stretchedY}
                        onChange={(e) => this.setState({ stretchedY: !this.state.stretchedY })}/>
                    }/>
                  <div>
                    <DropZone
                      accept='image/*'
                      multiple={false}
                      style={styles.dropArea}
                      activeStyle={styles.activeStyle}
                      rejectStyle={styles.rejectStyle}
                      onDrop={this._onBackgroundImageDrop}>
                      Try dropping an image here,<br/>
                      or click<br/>
                      to select image as background.
                    </DropZone>
                  </div>
                </CardContent>
              </Collapse>
            </Card>
            <Card style={styles.card}>
              <CardHeader
                title="Images"
                subheader="Upload Images as drawing "
                action={
                  <IconButton  onClick={(e) => this.setState({ expandImages: !this.state.expandImages })}>
                    <ExpandMore/>
                  </IconButton>
                }/>

              <Collapse in={this.state.expandImages}>
                <CardContent>
                  <div>
                    <TextField
                      label='Image URL'
                      helperText='Copy/Paste an image URL'
                      onChange={(e) => this.setState({ imageUrl: e.target.value })}
                      value={this.state.imageUrl}/>
                    <Button
                      variant="outlined"
                      onClick={(e) => { this._sketch.addImg(this.state.imageUrl) }}>
                      Load Image from URL
                    </Button>
                  </div>
                  <br/>
                  <Button
                    variant="outlined"
                    onClick={(e) => this._sketch.addImg(dataUrl)}>
                    Load Image from Data URL
                  </Button>
                </CardContent>
              </Collapse>
            </Card>


            <Card style={styles.card}>
              <CardHeader
                title="Controlled value"
                subheader="Control Component externally"
                action={
                  <IconButton
                    onClick={(e) => this.setState({ expandControlled: !this.state.expandControlled })}>
                    <ExpandMore/>
                  </IconButton>
                }/>
              <Collapse in={this.state.expandControlled}>
                <CardContent>
                  <Button
                    variant="outlined"
                    onClick={(e) => this.setState({
                      controlledValue: dataJsonControlled
                    })}>
                    Load controlled Value
                  </Button>
                </CardContent>
              </Collapse>
            </Card>
          </div>
        </div>
        <div style={{ width: 0 }}>
          <div className="col-xs-7 col-sm-7 col-md-9 col-lg-9">
            <div className="col-xs-5 col-sm-5 col-md-3 col-lg-3">

            </div>
          </div>

        </div>
      </MuiThemeProvider>
    );
  };
}

export default SketchFieldDemo;
