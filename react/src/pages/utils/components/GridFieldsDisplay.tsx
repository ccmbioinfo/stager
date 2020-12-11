import React, { useEffect, useState } from "react";
import { Grid } from "@material-ui/core";
import { Field } from "../typings";
import FieldDisplayEditable from "./FieldDisplayEditable";

// Yes, really
type Width = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

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
    orderPriority?: "left-right" | "top-down";
    columnWidth?: Width;
}) {
    const [enums, setEnums] = useState(undefined);

    useEffect(() => {
        fetch("/api/enums").then(async response => {
            if (response.ok) {
                const enums = await response.json();
                setEnums(enums);
            } else {
                console.error(
                    `GET /api/enums failed with ${response.status}: ${response.statusText}`
                );
            }
        });
    }, []);

    const infoWidth = props.columnWidth || 6;
    const numColumns = Math.floor(12 / infoWidth);

    let fieldColumns: Field[][] = [...Array(numColumns)].map(() => []);

    if (props.orderPriority === "left-right") {
        for (let i = 0; i < props.fields.length; i += numColumns) {
            for (let j = 0; j < numColumns; j++) {
                if (i + j < props.fields.length) fieldColumns[j].push(props.fields[i + j]);
            }
        }
    } else {
        const cap = Math.ceil(props.fields.length / numColumns);
        for (let i = 0; i < numColumns; i++) {
            for (let j = 0; j < cap; j++) {
                if (i + j < props.fields.length) fieldColumns[i].push(props.fields[i + j]);
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
                            enums={enums}
                            onEdit={props.onEdit}
                        />
                    ))}
                </Grid>
            ))}
        </>
    );

    // return (
    //     <>
    //         <Grid item xs={infoWidth}>
    //             {leftFields.map(field => (
    //                 <FieldDisplayEditable
    //                     field={field}
    //                     editMode={props.editMode}
    //                     enums={enums}
    //                     onEdit={props.onEdit}
    //                 />
    //             ))}
    //         </Grid>
    //         <Grid item xs={infoWidth}>
    //             {rightFields.map(field => (
    //                 <FieldDisplayEditable
    //                     field={field}
    //                     editMode={props.editMode}
    //                     enums={enums}
    //                     onEdit={props.onEdit}
    //                 />
    //             ))}
    //         </Grid>
    //     </>
    // );
}
