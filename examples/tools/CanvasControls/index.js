import React from "react";

import Typography from "@material-ui/core/Typography/Typography";
import {makeStyles} from "@material-ui/core";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import IconButton from "@material-ui/core/IconButton/IconButton";
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import FormControlLabel from "@material-ui/core/FormControlLabel/FormControlLabel";
import Switch from "@material-ui/core/Switch/Switch";
import Slider from "@material-ui/lab/Slider/Slider";
import CopyIcon from '@material-ui/icons/FileCopy';
import RemoveIcon from '@material-ui/icons/Remove';
import dataJsonControlled from "../../data.json.controlled";
import Button from "@material-ui/core/Button/Button";

const useStyles = makeStyles(theme => ({

}));

export default props => {
  const classes = useStyles();
  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon/>}
        aria-controls="panel1a-content"
        id="panel1a-header">
        <Typography variant="overline" gutterBottom>
          Controls &nbsp;
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails style={{display: 'block'}}>
        <div>
          <IconButton>
            <ZoomInIcon/>
          </IconButton>
          <IconButton>
            <ZoomOutIcon/>
          </IconButton>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <FormControlLabel
              control={
                <Switch
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
            />
            <br/>
            <Typography id="ySize">Change Canvas Height</Typography>
            <Slider
              step={1}
              min={10}
              max={1000}
            />
            <br/>
          </div>
        </div>
        <label htmlFor="zoom">Selection Actions (Select an object first!)</label>
        <div className="row">
          <div className="col">
            <IconButton
              color="primary"
            >
              <CopyIcon/>
            </IconButton>
          </div>
          <div className="col">
            <IconButton
              color="primary"
            >
              <RemoveIcon/>
            </IconButton>
          </div>
        </div>
        <Button
          variant="outlined"
          >
          Load controlled Value
        </Button>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
