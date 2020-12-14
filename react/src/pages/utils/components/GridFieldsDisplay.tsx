import React from "react";
import { Grid, GridProps } from "@material-ui/core";
import { Field } from "../typings";
import FieldDisplayEditable from "./FieldDisplayEditable";

// Grids are very picky about what sizes are allowed
type Width = Exclude<GridProps["xs"], boolean | "auto" | undefined>;

/**
 * Display a collection of editable fields. Number of columns can be specified.
 *
 * @param orderPriority How to display the fields (left-right first or top-down first)
 * @param columnWidth The width of each column (out of 12, must be an integer)
 */
export default function GridFieldsDisplay(props: {
    fields: Field[];
    editMode: boolean;
    onEdit: (fieldName: string | undefined, value: any) => void;
    enums: any;
    orderPriority?: "left-right" | "top-down";
    columnWidth?: Width;
}) {
    const infoWidth = props.columnWidth || 6;
    const numColumns = Math.floor(12 / infoWidth);

    let fieldColumns: Field[][] = [...Array(numColumns)].map(() => []);

    if (props.orderPriority === "left-right") {
        for (let i = 0; i < props.fields.length; i += numColumns) {
            for (let j = 0; j < numColumns; j++) {
                const index = i + j;
                if (index < props.fields.length) fieldColumns[j].push(props.fields[index]);
            }
        }
    } else {
        const cap = Math.ceil(props.fields.length / numColumns);
        for (let i = 0; i < numColumns; i++) {
            for (let j = 0; j < cap; j++) {
                const index = j + cap * i;
                if (index < props.fields.length) fieldColumns[i].push(props.fields[index]);
            }
        }
    }

    return (
        <>
            {fieldColumns.map(column => (
                <Grid item xs={infoWidth}>
                    {column.map(field => (
                        <FieldDisplayEditable
                            field={field}
                            editMode={props.editMode}
                            enums={props.enums}
                            onEdit={props.onEdit}
                        />
                    ))}
                </Grid>
            ))}
        </>
    );
}
