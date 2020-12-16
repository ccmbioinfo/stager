import React from "react";
import { createStyles, Theme, makeStyles, Chip } from "@material-ui/core";

export interface ChipStripProps {
    labels: string[];
    color: "primary" | "secondary" | "default";
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            "& > *": {
                margin: theme.spacing(0.5),
            },
        },
    })
);

export default function ChipStrip({ labels, color }: ChipStripProps) {
    const chipStyle = useStyles();

    return (
        <div className={chipStyle.root}>
            {labels.map(annotation => (
                <Chip size="medium" color={color} label={annotation} />
            ))}
        </div>
    );
}
