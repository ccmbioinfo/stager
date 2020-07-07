import React from 'react';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';

export interface ChipStripProps {
    labels: string[],
    color: "primary" | "secondary" | "default",
}

const makeChipStyle = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5),
      },
    },
  }),
);

export default function ChipStrip({labels, color} : ChipStripProps) {
    const chipStyle = makeChipStyle();

    return (
        <div className={chipStyle.root}>
            {labels.map( (annotation) =>
                <Chip size="medium" color={color} label={annotation} />
            )}
      </div>
    )
}