import React from "react";

import Typography from "@material-ui/core/Typography/Typography";
import {CompactPicker} from "react-color";
import Chip from "@material-ui/core/Chip/Chip";
import Grid from '@material-ui/core/Grid';
import VerticalLabel from '../VerticalLabel';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Switch from "@material-ui/core/Switch/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel/FormControlLabel";

export default props => {

  const chipColorSelectionStyle = {
    color: props.lineColor,
    borderColor: props.lineColor,
    backgroundColor: props.fillColor
  };

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon/>}
        aria-controls="panel1a-content"
        id="panel1a-header">
        <Typography variant="overline" gutterBottom>
          Colors &nbsp;
        </Typography>
        <Chip
          size="small"
          color="primary"
          variant="outline"
          label="Sample Colors"
          style={chipColorSelectionStyle}
        />
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Grid container spacing={1} alignItems="flex-end">
          <Grid item>
            <VerticalLabel label="Line Color"/>
            <CompactPicker
              id='lineColor'
              color={props.lineColor}
              onChange={props.onChangeLineColor}/>
          </Grid>
          <Grid item>
            <VerticalLabel label="Fill Color"/>
            <div style={{ display: "inline-block" }}>
              <FormControlLabel
                label="Enable"
                control={
                  <Switch/>
                }/>
              <br/>
              <CompactPicker
                color={props.fillColor}
                onChange={props.onChangeFillColor}/>
            </div>
          </Grid>
        </Grid>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
