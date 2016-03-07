'use strict';

import React from 'react';
import ColorPicker from 'react-color';

import 'flexboxgrid';
import './main.css';

import {
    Card,CardText,CardTitle,CardHeader,
    AppBar,Divider,GridList,GridTile,
    Slider,
    Toggle,
    MenuItem,
    SelectField,
    RaisedButton,FlatButton,IconButton,
    FloatingActionButton,
    Toolbar,ToolbarGroup,ToolbarSeparator,ToolbarTitle
} from 'material-ui';

import UndoIcon from 'material-ui/lib/svg-icons/content/undo';
import RedoIcon from 'material-ui/lib/svg-icons/content/redo';
import ClearIcon from 'material-ui/lib/svg-icons/action/delete';
import SaveIcon from 'material-ui/lib/svg-icons/content/save';
import RemoveIcon from 'material-ui/lib/svg-icons/content/clear';

import Tools from '../src/Tools';
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

        this.state = {
            color: 'black',
            lineWidth: 2,
            fill: '#68CCCA',
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

    render() {
        return (
            <div className='row'>
                <div className='col-xs-12 col-sm-12 col-md-12 col-lg-12' style={{height:'64px'}}>
                    <AppBar title='Sketch Tool' showMenuIconButton={false}>
                        <IconButton onTouchTap={this._undo} disabled={!this.state.canUndo}>
                            <UndoIcon/>
                        </IconButton>
                        <IconButton onTouchTap={this._redo} disabled={!this.state.canRedo}>
                            <RedoIcon/>
                        </IconButton>
                        <IconButton onTouchTap={this._clear}>
                            <ClearIcon/>
                        </IconButton>
                        <IconButton onTouchTap={this._save}>
                            <SaveIcon/>
                        </IconButton>
                    </AppBar>
                </div>
                <div className='col-xs-7 col-sm-7 col-md-9 col-lg-9'>
                    {/* Sketch area */}
                    <SketchField name='sketch'
                                 height='660px'
                                 style={{position:'relative'}}
                                 onChange={(c,d) => this.setState({canUndo: this._sketch.canUndo()})}
                                 className='canvas-area'
                                 tool={this.state.tool}
                                 color={this.state.color}
                                 ref={(c) => this._sketch = c}
                                 lineWidth={this.state.lineWidth}
                                 fill={this.state.fillWithColor ? this.state.fill : 'transparent'}/>
                </div>
                <div className='col-xs-5 col-sm-5 col-md-3 col-lg-3'>
                    <Card style={{margin:'5px 10px 5px 0'}}>
                        <CardTitle title='Select Tool'/>
                        <CardText>
                            <label htmlFor='tool'>Canvas Tool</label><br/>
                            <SelectField ref='tool' value={this.state.tool} onChange={this._selectTool}>
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
                                    defaultValue={this.state.lineWidth/10}
                                    onChange={(e, v) => this.setState({lineWidth:v*10})}/>
                        </CardText>
                    </Card>
                    <Card style={{margin:'5px 10px 5px 0'}}>
                        <CardTitle title='Select Colors'/>
                        <CardText>
                            <label htmlFor='lineColor'>Line Color</label>
                            <ColorPicker ref='lineColor' type='compact' color={this.state.color}
                                         onChange={(color) => this.setState({color:'#'+color.hex})}/>
                            <br/>
                            <br/>
                            <Toggle label="Fill Color"
                                    defaultToggled={this.state.fillWithColor}
                                    onToggle={(e) => this.setState({fillWithColor:!this.state.fillWithColor})}/>
                            <ColorPicker type="compact"
                                         color={this.state.fill}
                                         onChange={(color) => this.setState({fill:'#'+color.hex})}/>
                        </CardText>
                    </Card>
                </div>
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
        )
    }
}

export default SketchFieldDemo;