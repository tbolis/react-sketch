'use strict';

import React from 'react';
import ColorPicker from 'react-color';

import 'flexboxgrid';
import './main.css';

import {
    Card,CardText,CardTitle,
    AppBar,GridList,GridTile,
    Slider, Toggle, MenuItem,
    SelectField, IconButton
} from 'material-ui';

import UndoIcon from 'material-ui/lib/svg-icons/content/undo';
import RedoIcon from 'material-ui/lib/svg-icons/content/redo';
import ClearIcon from 'material-ui/lib/svg-icons/action/delete';
import SaveIcon from 'material-ui/lib/svg-icons/content/save';
import RemoveIcon from 'material-ui/lib/svg-icons/content/clear';

import Tools from '../src/tools';
import SketchField from '../src/SketchField';

const styles = {
    root: {
        padding: '3px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
    },
    gridList: {
        width: '100%',
        height: 400,
        overflowY: 'auto',
        marginBottom: 24
    },
    gridTile: {
        backgroundColor: '#fcfcfc'
    }
};

class SketchFieldDemo extends React.Component {
    constructor(params) {
        super(params);

        this._save = this._save.bind(this);
        this._selectTool = this._selectTool.bind(this);
        this._renderTile = this._renderTile.bind(this);
        this._removeMe = this._removeMe.bind(this);
        this._undo = this._undo.bind(this);
        this._redo = this._redo.bind(this);
        this._clear = this._clear.bind(this);
        this._toggleEdit = this._toggleEdit.bind(this);

        this.state = {
            lineColor: 'black',
            lineWidth: 2,
            fillColor: '#68CCCA',
            shadowWidth: 0,
            shadowOffset: 0,
            tool: Tools.Pencil,
            fillWithColor: false,
            drawings: [],
            canUndo: false,
            canRedo: false
        };
    }

    _selectTool(event, index, value) {
        this.setState({
            tool: value
        });
    }

    _save() {
        let drawings = this.state.drawings;
        drawings.push(this._sketch.getContent());
        this.setState({drawings: drawings});
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
        this.setState({
            canUndo: this._sketch.canUndo(),
            canRedo: this._sketch.canRedo()
        })
    }

    _toggleEdit = (event, toggled) => {
        this.setState({
            drawingMode: !toggled
        });
    };

    render() {

        let styles = {
            iconButton: {
                width: '42px',
                height: '42px'
            }
        };

        return (
            <div>

                {/* Application Bar with tools */}

                <div className='row'>
                    <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12'>
                        <AppBar title='Sketch Tool' showMenuIconButton={false}>
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
                            &nbsp;
                            &nbsp;
                            &nbsp;
                            <IconButton
                                onTouchTap={this._clear}
                                iconStyle={styles.iconButton}>
                                <ClearIcon />
                            </IconButton>
                            <IconButton
                                onTouchTap={this._save}
                                iconStyle={styles.iconButton}>
                                <SaveIcon />
                            </IconButton>
                        </AppBar>
                    </div>
                </div>

                {/*Sketch Area with tools*/}

                <div className='row'>
                    <div className='col-xs-7 col-sm-7 col-md-9 col-lg-9'>

                        {/* Sketch area */}
                        <div style={{padding:'3px'}}>
                            <SketchField
                                name='sketch'
                                className='canvas-area'
                                ref={(c) => this._sketch = c}
                                lineColor={this.state.lineColor}
                                lineWidth={this.state.lineWidth}
                                fillColor={this.state.fillWithColor ? this.state.fillColor : 'transparent'}
                                scaleOnResize={true}
                                height={660}


                                onChange={(c,d) => this.setState({canUndo: this._sketch.canUndo()})}

                                tool={this.state.tool}

                            />
                        </div>
                    </div>
                    <div className='col-xs-5 col-sm-5 col-md-3 col-lg-3'>
                        {/*<Card style={{margin:'5px 10px 5px 0'}}>
                         <CardTitle title='Options'/>
                         <CardText>
                         <Toggle label="Edit" onToggle={this._toggleEdit}/>
                         </CardText>
                         </Card>*/}

                        <Card style={{margin:'10px 10px 5px 0'}}>
                            <CardTitle title='Tools'/>
                            <CardText>
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
                            </CardText>
                        </Card>
                        <Card style={{margin:'5px 10px 5px 0'}}>
                            <CardTitle title='Colors'/>
                            <CardText>
                                <label htmlFor='lineColor'>Line</label>
                                <ColorPicker ref='lineColor' type='compact' color={this.state.lineColor}
                                             onChange={(color) => this.setState({lineColor:'#'+color.hex})}/>
                                <br/>
                                <br/>
                                <Toggle label="Fill"
                                        defaultToggled={this.state.fillWithColor}
                                        onToggle={(e) => this.setState({fillWithColor:!this.state.fillWithColor})}/>
                                <ColorPicker type="compact"
                                             color={this.state.fillColor}
                                             onChange={(color) => this.setState({fillColor:'#'+color.hex})}/>
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
        )
    }
}

export default SketchFieldDemo;