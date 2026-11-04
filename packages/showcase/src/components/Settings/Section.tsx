import type { ReactElement, ReactNode } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface SectionProps {
  title: string;
  /** Short summary of the current value, shown next to the title */
  chip?: string;
  children: ReactNode;
}

/**
 * A group of the settings, with its title
 */
const Section = ({ title, chip, children }: SectionProps): ReactElement => (
  <Stack component="section" spacing={1} sx={{ py: 1.5 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="overline" component="h3" sx={{ lineHeight: 2 }}>
        {title}
      </Typography>
      {chip && <Chip variant="outlined" color="primary" size="small" label={chip} />}
    </Stack>
    {children}
  </Stack>
);

export default Section;
