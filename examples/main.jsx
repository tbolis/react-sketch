/*eslint no-unused-vars: 0*/
'use strict';

import React from 'react';
import {CompactPicker} from 'react-color';

import 'flexboxgrid';
import './main.css';

import {
    Card,CardText,CardTitle,CardHeader,
    Drawer,
    AppBar,GridList,GridTile,
    Slider, Toggle, MenuItem,
    SelectField, IconButton,
    ToolbarSeparator
} from 'material-ui';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import UndoIcon from 'material-ui/svg-icons/content/undo';
import RedoIcon from 'material-ui/svg-icons/content/redo';
import ClearIcon from 'material-ui/svg-icons/action/delete';
import SaveIcon from 'material-ui/svg-icons/content/save';
import RemoveIcon from 'material-ui/svg-icons/content/clear';
import DownloadIcon from 'material-ui/svg-icons/file/file-download';
import ZoomInIcon from 'material-ui/svg-icons/action/zoom-in';
import ZoomOutIcon from 'material-ui/svg-icons/action/zoom-out';

import dataJson from './data.json'
import dataUrl from './data.url'

import {SketchField, Tools} from '../src';

const styles = {
    root: {
        padding: '3px',
        display: 'flex',
        flexWrap: 'wrap',
        margin: '10px 10px 5px 10px',
        justifyContent: 'space-around'
    },
    gridList: {
        width: '100%',
        overflowY: 'auto',
        marginBottom: '24px'
    },
    gridTile: {
        backgroundColor: '#fcfcfc'
    },
    appBar: {
        backgroundColor: '#333'
    },
    separator: {
        height: '42px',
        backgroundColor: 'white'
    },
    iconButton: {
        fill: 'white',
        width: '42px',
        height: '42px'
    }
};

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

import PureRenderMixin from 'react-addons-pure-render-mixin';

class SketchFieldDemo extends React.Component {
    constructor(params) {
        super(params);

        this._save = this._save.bind(this);
        this._undo = this._undo.bind(this);
        this._redo = this._redo.bind(this);
        this._clear = this._clear.bind(this);
        this._removeMe = this._removeMe.bind(this);
        this._download = this._download.bind(this);
        this._renderTile = this._renderTile.bind(this);
        this._selectTool = this._selectTool.bind(this);
        this._onSketchChange = this._onSketchChange.bind(this);

        //this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

    }

    state = {
        lineColor: 'black',
        lineWidth: 10,
        fillColor: '#68CCCA',
        shadowWidth: 0,
        shadowOffset: 0,
        tool: Tools.Pencil,
        fillWithColor: false,
        drawings: [],
        canUndo: false,
        canRedo: false,
        controlledSize: false,
        sketchWidth: 600,
        sketchHeight: 600
    };

    componentDidMount() {

        /*eslint-disable no-console*/

        (function (console) {
            console.save = function (data, filename) {
                if (!data) {
                    console.error('Console.save: No data');
                    return;
                }
                if (!filename) filename = 'console.json';
                if (typeof data === 'object') {
                    data = JSON.stringify(data, undefined, 4)
                }
                var blob = new Blob([data], {type: 'text/json'}),
                    e = document.createEvent('MouseEvents'),
                    a = document.createElement('a');
                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e)
            }
        })(console);

        /*eslint-enable no-console*/

    }

    _selectTool(event, index, value) {
        this.setState({
            tool: value
        });
    }

    _save() {
        let drawings = this.state.drawings;
        drawings.push(this._sketch.toDataURL());
        this.setState({drawings: drawings});
    }

    _download() {
        /*eslint-disable no-console*/

        console.save(this._sketch.toDataURL(), 'toDataURL.txt');
        console.save(JSON.stringify(this._sketch.toJSON()), 'toDataJSON.txt');

        /*eslint-enable no-console*/

        let {imgDown} = this.refs;
        let event = new Event('click', {});

        imgDown.href = this._sketch.toDataURL();
        imgDown.download = 'toPNG.png';
        imgDown.dispatchEvent(event);
    }

    _renderTile(drawing, index) {
        return (
            <GridTile
                key={index}
                title='Canvas Image'
                actionPosition="left"
                titlePosition="top"
                titleBackground="linear-gradient(to bottom, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)"
                cols={1} rows={1} style={styles.gridTile}
                actionIcon={<IconButton onTouchTap={(c) => this._removeMe(index)}><RemoveIcon color="white"/></IconButton>}>
                <img src={drawing}/>
            </GridTile>
        );
    }

    _removeMe(index) {
        let drawings = this.state.drawings;
        drawings.splice(index, 1);
        this.setState({drawings: drawings});
    }

    _undo() {
        this._sketch.undo();
        this.setState({
            canUndo: this._sketch.canUndo(),
            canRedo: this._sketch.canRedo()
        })
    }

    _redo() {
        this._sketch.redo();
        this.setState({
            canUndo: this._sketch.canUndo(),
            canRedo: this._sketch.canRedo()
        })
    }

    _clear() {
        this._sketch.clear();
    }

    _onSketchChange() {
        let prev = this.state.canUndo;
        let now = this._sketch.canUndo();
        if (prev !== now) {
            this.setState({canUndo: now});
        }
    }

    render() {
        return (

            <MuiThemeProvider muiTheme={getMuiTheme()}>

                <div>

                    {/* Application Bar with tools */}

                    <div className='row'>
                        <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
                            <AppBar title='Sketch Tool' showMenuIconButton={false} style={styles.appBar}>
                                <IconButton
                                    onTouchTap={this._undo}
                                    iconStyle={styles.iconButton}>
                                    <UndoIcon />
                                </IconButton>
                                <IconButton
                                    onTouchTap={this._redo}
                                    iconStyle={styles.iconButton}
                                    disabled={!this.state.canRedo}>
                                    <RedoIcon/>
                                </IconButton>
                                <ToolbarSeparator style={styles.separator}/>
                                <IconButton
                                    onTouchTap={this._save}
                                    iconStyle={styles.iconButton}>
                                    <SaveIcon />
                                </IconButton>
                                <IconButton
                                    onTouchTap={this._download}
                                    iconStyle={styles.iconButton}>
                                    <DownloadIcon />
                                </IconButton>
                                <a ref='imgDown'/>
                                <ToolbarSeparator style={styles.separator}/>
                                <IconButton
                                    onTouchTap={this._clear}
                                    iconStyle={styles.iconButton}>
                                    <ClearIcon />
                                </IconButton>
                            </AppBar>
                        </div>
                    </div>

                    {/*Sketch Area with tools*/}

                    <div className='row'>
                        <div className='col-xs-7 col-sm-7 col-md-9 col-lg-9'>

                            {/* Sketch area */}
                            <SketchField
                                name='sketch'
                                className='canvas-area'
                                ref={(c) => this._sketch = c}
                                lineColor={this.state.lineColor}
                                lineWidth={this.state.lineWidth}
                                fillColor={this.state.fillWithColor ? this.state.fillColor : 'transparent'}
                                width={this.state.controlledSize?this.state.sketchWidth:null}
                                height={this.state.controlledSize?this.state.sketchHeight:null}
                                defaultData={dataJson}
                                defaultDataType="json"
                                onChange={this._onSketchChange}
                                tool={this.state.tool}
                            />
                        </div>
                        <div className='col-xs-5 col-sm-5 col-md-3 col-lg-3'>
                            <Card style={{margin:'10px 10px 5px 0'}}>
                                <CardHeader title='Tools' actAsExpander={true} showExpandableButton={true}/>
                                <CardText expandable={true}>
                                    <label htmlFor='tool'>Canvas Tool</label><br/>
                                    <SelectField ref='tool' value={this.state.tool} onChange={this._selectTool}>
                                        <MenuItem value={Tools.Select} primaryText="Select"/>
                                        <MenuItem value={Tools.Pencil} primaryText="Pencil"/>
                                        <MenuItem value={Tools.Line} primaryText="Line"/>
                                        <MenuItem value={Tools.Rectangle} primaryText="Rectangle"/>
                                        <MenuItem value={Tools.Circle} primaryText="Circle"/>
                                    </SelectField>
                                    <br/>
                                    <br/>
                                    <br/>
                                    <label htmlFor='slider'>Line Weight</label>
                                    <Slider ref='slider' step={0.1}
                                            defaultValue={this.state.lineWidth/100}
                                            onChange={(e, v) => this.setState({lineWidth:v*100})}/>
                                    <br/>
                                    <label htmlFor='zoom'>Zoom</label>
                                    <div>
                                        <IconButton
                                            ref='zoom'
                                            onTouchTap={(e) => this._sketch.zoom(1.25)}>
                                            <ZoomInIcon />
                                        </IconButton>
                                        <IconButton
                                            ref='zoom1'
                                            onTouchTap={(e) => this._sketch.zoom(0.8)}>
                                            <ZoomOutIcon />
                                        </IconButton>
                                        <br/>
                                        <br/>
                                        <Toggle label="Control size"
                                                defaultToggled={this.state.controlledSize}
                                                onToggle={(e) => this.setState({controlledSize:!this.state.controlledSize})}/>
                                        <br/>
                                        <label htmlFor='xSize'>Change Canvas Width</label>
                                        <Slider ref='xSize' step={1}
                                                min={10} max={1000}
                                                defaultValue={this.state.sketchWidth}
                                                onChange={(e, v) => this.setState({sketchWidth:v})}/>
                                        <br/>
                                        <label htmlFor='ySize'>Change Canvas Height</label>
                                        <Slider ref='ySize' step={1}
                                                min={10} max={1000}
                                                defaultValue={this.state.sketchHeight}
                                                onChange={(e, v) => this.setState({sketchHeight:v})}/>
                                        <br/>
                                    </div>
                                </CardText>
                            </Card>
                            <Card initiallyExpanded={true} style={{margin:'5px 10px 5px 0'}}>
                                <CardHeader title='Colors' actAsExpander={true} showExpandableButton={true}/>
                                <CardText expandable={true}>
                                    <label htmlFor='lineColor'>Line</label>
                                    <CompactPicker
                                        id='lineColor' color={this.state.lineColor}
                                        onChange={(color) => this.setState({lineColor:color.hex})}/>
                                    <br/>
                                    <br/>
                                    <Toggle label="Fill"
                                            defaultToggled={this.state.fillWithColor}
                                            onToggle={(e) => this.setState({fillWithColor:!this.state.fillWithColor})}/>
                                    <CompactPicker
                                        color={this.state.fillColor}
                                        onChange={(color) => this.setState({fillColor:color.hex})}/>
                                </CardText>
                            </Card>
                        </div>
                    </div>

                    {/*Saved Paintings*/}

                    <div className='row'>
                        <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                            <div className="box" style={styles.root}>
                                <GridList
                                    cols={5}
                                    cellHeight={200}
                                    padding={1} style={styles.gridList}>
                                    {this.state.drawings.map(this._renderTile)}
                                </GridList>
                            </div>
                        </div>
                    </div>
                </div>
            </MuiThemeProvider>
        )
    }
}

export default SketchFieldDemo;