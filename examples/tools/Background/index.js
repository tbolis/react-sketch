import React from "react";

import Typography from "@material-ui/core/Typography/Typography";
import {makeStyles} from "@material-ui/core";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from "@material-ui/core/Switch/Switch";
import {CompactPicker} from "react-color";
import Grid from '@material-ui/core/Grid';
import VerticalLabel from '../VerticalLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import DropZone from "react-dropzone"

const useStyles = makeStyles(theme => ({
  verticalLabel: {
    width: "24px",
    display: "inline-block",
    textOrientation: "mixed",
    writingMode: "sideways-lr",
    marginRight: theme.spacing(1)
  },
  fitSelection: {
    display: 'inline-block'
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
          Background &nbsp;
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Grid container spacing={1} alignItems="flex-end">
          <Grid item>
            <VerticalLabel label="Background Color"/>
            <div style={{ display: "inline-block" }}>
              <FormControlLabel
                label="Enable"
                control={
                  <Switch
                    value={false}
                  />
                }/>
              <br/>
              <CompactPicker/>
            </div>
          </Grid>
          <Grid item>
            <VerticalLabel label="Load Image Background"/>
            <div style={{ display: "inline-block" }}>
              <FormControlLabel
                label="Fit canvas"
                control={
                  <Switch/>
                }/>
              <br/>
              <RadioGroup aria-label="fit" className={classes.fitSelection}>
                <FormControlLabel value="x" control={<Radio/>} label="(X)"/>
                <FormControlLabel value="y" control={<Radio/>} label="(Y)"/>
                <FormControlLabel value="xy" control={<Radio/>} label="(X,Y)"/>
              </RadioGroup>
              <br/>
              <DropZone
                multiple={false}
                onDrop={acceptedFiles => console.log(acceptedFiles)}>
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div className={classes.dropArea} {...getRootProps()}>
                      <input {...getInputProps()} />
                      <p>Drag 'n' drop some files here, <br/>or click to select files</p>
                    </div>
                  </section>
                )}
              </DropZone>
            </div>
          </Grid>
        </Grid>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
