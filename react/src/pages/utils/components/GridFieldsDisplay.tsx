import React, { useEffect, useState } from "react";
import { Grid } from "@material-ui/core";
import { Field } from "../typings";
import FieldDisplayEditable from "./FieldDisplayEditable";

const infoWidth = 6;

/**
 * Display a collection of Fields in two columns in the specified order.
 */
export default function GridFieldsDisplay(props: {
    fields: Field[];
    editMode: boolean;
    onEdit: (fieldName: string | undefined, value: any) => void;
    orderPriority?: "left-right" | "top-down";
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

    let leftFields: Field[] = [];
    let rightFields: Field[] = [];
    const cap = Math.ceil(props.fields.length / 2);

    if (props.orderPriority === "left-right") {
        for (let i = 0; i < props.fields.length; i += 2) {
            const j = i + 1;
            leftFields.push(props.fields[i]);
            if (j < props.fields.length) rightFields.push(props.fields[j]);
        }
    } else {
        for (let i = 0; i < cap; i++) {
            const j = cap + i;
            leftFields.push(props.fields[i]);
            if (j < props.fields.length) rightFields.push(props.fields[j]);
        }
    }

    return (
        <>
            <Grid item xs={infoWidth}>
                {leftFields.map(field => (
                    <FieldDisplayEditable
                        field={field}
                        editMode={props.editMode}
                        enums={enums}
                        onEdit={props.onEdit}
                    />
                ))}
            </Grid>
            <Grid item xs={infoWidth}>
                {rightFields.map(field => (
                    <FieldDisplayEditable
                        field={field}
                        editMode={props.editMode}
                        enums={enums}
                        onEdit={props.onEdit}
                    />
                ))}
            </Grid>
        </>
    );
}
