import "./index.css";
import React from "react";
import PenIcon from "@material-ui/icons/Gesture";
import LineIcon from "@material-ui/icons/Straighten";
import Chip from "@material-ui/core/Chip";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import Typography from "@material-ui/core/Typography";
import { Accordion, AccordionSummary, AccordionDetails } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

interface ToolSelectorProps {
  selected: string;
  onChange?: (event: React.MouseEvent<HTMLElement>, value: any) => void;
}

const ToolSelector = (props: ToolSelectorProps): JSX.Element => {
  const toolset = [
    <ToggleButton key={"pencil"} value={"pencil"}>
      <PenIcon />
    </ToggleButton>,
    <ToggleButton key={"line"} value={"line"}>
      <LineIcon />
    </ToggleButton>,
  ];

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header">
        <Typography variant="overline" gutterBottom>
          Canvas Tool &nbsp;
        </Typography>
        <Chip
          variant="outlined"
          color="primary"
          size="small"
          label={props.selected}
        />
      </AccordionSummary>
      <AccordionDetails style={{ display: "block" }}>
        <ToggleButtonGroup
          exclusive
          size="large"
          value={props.selected}
          className="canvas-tools"
          onChange={props.onChange}>
          {toolset}
        </ToggleButtonGroup>
      </AccordionDetails>
    </Accordion>
  );
};

export default ToolSelector;
