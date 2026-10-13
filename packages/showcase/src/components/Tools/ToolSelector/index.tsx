import type { MouseEvent, ReactElement } from "react";
import PenIcon from "@mui/icons-material/Gesture";
import LineIcon from "@mui/icons-material/Straighten";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ToolSelectorProps {
  selected: string;
  onChange?: (event: MouseEvent<HTMLElement>, value: string | null) => void;
}

const ToolSelector = (props: ToolSelectorProps): ReactElement => {
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
      <AccordionDetails sx={{ display: "block" }}>
        <ToggleButtonGroup
          exclusive
          size="large"
          value={props.selected}
          sx={{ display: "inline-block" }}
          onChange={props.onChange}>
          {toolset}
        </ToggleButtonGroup>
      </AccordionDetails>
    </Accordion>
  );
};

export default ToolSelector;
