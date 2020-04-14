import React from 'react';

import PenIcon from '@material-ui/icons/Gesture';
import LineIcon from '@material-ui/icons/Straighten';
import CircleIcon from '@material-ui/icons/RadioButtonUnchecked';
import RectangleIcon from '@material-ui/icons/Crop54';
import SelectIcon from '@material-ui/icons/PhotoSizeSelectSmall';
// import PanIcon from '@material-ui/icons/OpenWith';
import PanIcon from '@material-ui/icons/PanTool';
import Chip from '@material-ui/core/Chip';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Tools from "../../../src/tools";
import Typography from '@material-ui/core/Typography';
import './index.css'


import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Slider from '@material-ui/core/Slider';
import ExposureNeg1Icon from '@material-ui/icons/ExposureNeg1';
import ExposurePlus1Icon from '@material-ui/icons/ExposurePlus1';

import Grid from '@material-ui/core/Grid';
export default props => {

  const toolset = [
    <ToggleButton key={Tools.Pencil} value={Tools.Pencil}>
      <PenIcon/>
    </ToggleButton>,
    <ToggleButton key={Tools.Line} value={Tools.Line}>
      <LineIcon/>
    </ToggleButton>,
    <ToggleButton key={Tools.Circle} value={Tools.Circle}>
      <CircleIcon/>
    </ToggleButton>,
    <ToggleButton key={Tools.Rectangle} value={Tools.Rectangle}>
      <RectangleIcon/>
    </ToggleButton>,
    <ToggleButton key={Tools.Select} value={Tools.Select}>
      <SelectIcon/>
    </ToggleButton>,
    <ToggleButton key={Tools.Pan} value={Tools.Pan}>
      <PanIcon/>
    </ToggleButton>,
  ];

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon/>}
        aria-controls="panel1a-content"
        id="panel1a-header">
        <Typography variant="overline" gutterBottom>
          Canvas Tool &nbsp;
        </Typography>
        <Chip variant="outlined" color="primary" size="small" label={props.selected}/>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails style={{display: 'block'}}>
        <ToggleButtonGroup
          exclusive
          size="large"
          value={props.selected}
          className="canvas-tools"
          onChange={props.onChange}>
          {toolset}
        </ToggleButtonGroup>
        <Grid container spacing={1}>
          <Grid item>
            <ExposureNeg1Icon />
          </Grid>
          <Grid item xs>
            <Slider  aria-labelledby="continuous-slider" />
          </Grid>
          <Grid item>
            <ExposurePlus1Icon />
          </Grid>
        </Grid>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}