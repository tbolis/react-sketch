import React from 'react';

import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TextField from "@material-ui/core/TextField/TextField";
import Button from "@material-ui/core/Button/Button";

export default props => {

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon/>}
        aria-controls="panel1a-content"
        id="panel1a-header">
        <Typography variant="overline" gutterBottom>
          Image & Upload &nbsp;
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <div>
          <TextField
            label='Image URL'
            helperText='Copy/Paste an image URL'
          />
          <Button
            variant="outlined"
          >
            Load Image from URL
          </Button>
        </div>
        <br/>
        <Button
          variant="outlined"
        >
          Load Image from Data URL
        </Button>

      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}