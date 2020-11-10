import React, { useState } from "react";
import { Button, Collapse, Grid, Typography } from "@material-ui/core";
import { FieldDisplayValueType } from "../typings";

const gridSpacing = 2;
const titleWidth = 12;
const infoWidth = 6;

interface FieldDisplayProps {
    title: string;
    value?: FieldDisplayValueType;
}

/* Simple Typography component to display "title: value" */
function FieldDisplay({ title, value }: FieldDisplayProps) {
    let val = value;
    if (Array.isArray(value)) val = value.join(", ");
    else if (value === null || value === undefined) val = "";
    else if (typeof value === "boolean") val = value ? "Yes" : "No";

    return (
        <Typography variant="body1" gutterBottom>
            <b>{title}:</b> {val}
        </Typography>
    );
}

interface GridFieldDisplayProps {
    titles: string[];
    values: FieldDisplayValueType[];
}

function LeftGridFieldsDisplay({ titles, values }: GridFieldDisplayProps) {
    return (
        <>
            {titles.map((title, index) => {
                if (index >= Math.ceil(titles.length / 2)) {
                    return <></>;
                } else {
                    return <FieldDisplay title={title} value={values[index]} />;
                }
            })}
        </>
    );
}

function RightGridFieldsDisplay({ titles, values }: GridFieldDisplayProps) {
    return (
        <>
            {titles.map((title, index) => {
                if (index < Math.ceil(titles.length / 2)) {
                    return <></>;
                } else {
                    return <FieldDisplay title={title} value={values[index]} />;
                }
            })}
        </>
    );
}

interface DetailSectionProps {
    titles: string[];
    values: FieldDisplayValueType[];
    collapsibleTitles?: string[];
    collapsibleValues?: FieldDisplayValueType[];
    title?: string;
}

export default function DetailSection({
    titles,
    values,
    collapsibleTitles,
    collapsibleValues,
    title,
}: DetailSectionProps) {
    const [moreDetails, setMoreDetails] = useState(false);

    return (
        <>
            <Grid container spacing={gridSpacing} justify="space-evenly">
                {title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{title}</Typography>
                    </Grid>
                )}
                <Grid item xs={infoWidth}>
                    <LeftGridFieldsDisplay titles={titles} values={values} />
                </Grid>
                <Grid item xs={infoWidth}>
                    <RightGridFieldsDisplay titles={titles} values={values} />
                </Grid>
            </Grid>
            {collapsibleTitles && collapsibleValues && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <Grid item xs={infoWidth}>
                                <LeftGridFieldsDisplay
                                    titles={collapsibleTitles}
                                    values={collapsibleValues}
                                />
                            </Grid>
                            <Grid item xs={infoWidth}>
                                <RightGridFieldsDisplay
                                    titles={collapsibleTitles}
                                    values={collapsibleValues}
                                />
                            </Grid>
                        </Grid>
                    </Collapse>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            setMoreDetails(!moreDetails);
                        }}
                    >
                        {moreDetails ? "Hide" : "Show"} more details
                    </Button>
                </>
            )}
        </>
    );
}
