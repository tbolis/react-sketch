import type { ReactElement, ReactNode } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface SectionProps {
  id: string;
  title: string;
  /** Short summary of the current value, shown next to the title */
  chip?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

/**
 * A collapsible panel of the tools
 */
const Section = ({
  id,
  title,
  chip,
  defaultExpanded,
  children,
}: SectionProps): ReactElement => {
  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${id}-content`}
        id={`${id}-header`}>
        <Typography variant="overline" gutterBottom>
          {title} &nbsp;
        </Typography>
        {chip && (
          <Chip variant="outlined" color="primary" size="small" label={chip} />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ display: "block" }}>{children}</AccordionDetails>
    </Accordion>
  );
};

export default Section;
