import React, { useState } from "react";
import { Button, Collapse, Grid, Typography } from "@material-ui/core";
import { FieldDisplay } from "./components";
import { FieldDisplayValueType } from "../typings";

const gridSpacing = 2;
const titleWidth = 12;
const infoWidth = 6;

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

    const getLeftFieldDisplay = (titles: string[], values: FieldDisplayValueType[]) => {
        return titles.map((title, index) => {
            if (index >= Math.ceil(titles.length / 2)) {
                return (<></>);
            } else {
                return <FieldDisplay title={title} value={values[index]} />;
            }
        });
    };
    const getRightFieldDisplay = (titles: string[], values: FieldDisplayValueType[]) => {
        return titles.map((title, index) => {
            if (index < Math.ceil(titles.length / 2)) {
                return (<></>);
            }
            return <FieldDisplay title={title} value={values[index]} />;
        });
    };

    return (
        <>
            <Grid container spacing={gridSpacing} justify="space-evenly">
                {title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{title}</Typography>
                    </Grid>
                )}

                <Grid item xs={infoWidth}>
                    {getLeftFieldDisplay(titles, values)}
                </Grid>
                <Grid item xs={infoWidth}>
                    {getRightFieldDisplay(titles, values)}
                </Grid>
            </Grid>
            {collapsibleTitles && collapsibleValues && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <Grid item xs={infoWidth}>
                                {getLeftFieldDisplay(collapsibleTitles, collapsibleValues)}
                            </Grid>
                            <Grid item xs={infoWidth}>
                                {getRightFieldDisplay(collapsibleTitles, collapsibleValues)}
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
