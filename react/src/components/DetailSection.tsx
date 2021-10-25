import { useEffect, useState } from "react";
import {
    Button,
    Collapse,
    FormControlLabel,
    Grid,
    makeStyles,
    Switch,
    Typography,
} from "@material-ui/core";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { Field } from "../typings";
import GridFieldsDisplay, { Width } from "./GridFieldsDisplay";

dayjs.extend(customParseFormat);

const gridSpacing = 2;
const titleWidth = 12;

const useStyles = makeStyles(theme => ({
    switch: {
        display: "block",
        padding: theme.spacing(1),
        margin: 0,
    },
    button: {
        marginRight: theme.spacing(1),
    },
}));

interface DetailSectionProps {
    fields: Field[];
    enums?: Record<string, string[]>;
    editable?: boolean;
    columnWidth?: Width;
    collapsibleFields?: Field[];
    title?: string;
    linkPath?: string;
    update?: (fields: Field[]) => void;
}

export default function DetailSection(props: DetailSectionProps) {
    const classes = useStyles();
    const [moreDetails, setMoreDetails] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);

    // internal form state
    const [primaryFields, setPrimaryFields] = useState<Field[]>([]);
    const [secondaryFields, setSecondaryFields] = useState<Field[]>(
        props.collapsibleFields ? props.collapsibleFields : []
    );

    // keep fields in sync with parents in case of update/refresh
    useEffect(() => {
        setPrimaryFields(props.fields);
    }, [props.fields]);

    useEffect(() => {
        setSecondaryFields(props.collapsibleFields ? props.collapsibleFields : []);
    }, [props.collapsibleFields]);

    // Update field of name fieldName with new value
    function OnEditData(fieldName: string | undefined, value: any) {
        if (fieldName) {
            let idx = primaryFields.findIndex(element => element.fieldName === fieldName);
            let fieldsOnEdit = primaryFields;
            let setFields = setPrimaryFields;
            if (idx < 0) {
                idx = secondaryFields.findIndex(element => element.fieldName === fieldName);
                fieldsOnEdit = secondaryFields;
                setFields = setSecondaryFields;
            }

            const field = fieldsOnEdit.find(element => element.fieldName === fieldName);
            if (!field) return;

            field.entryError = false;
            if (field.fieldName === "read_length" && value && value.match(/^[0-9]+$/) === null) {
                field.entryError = true;
            } else if (
                field.fieldName === "month_of_birth" &&
                value &&
                value.match(/^(0[1-9]|1[012])-\d{4}$/) === null
            ) {
                field.entryError = true;
            }
            const newField = {
                ...field,
                value: value,
            };
            const newData = [...fieldsOnEdit];
            newData[idx] = newField;
            setFields(newData);
        }
    }

    return (
        <>
            <Grid container spacing={gridSpacing} justifyContent="space-between">
                {props.title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{props.title}</Typography>
                    </Grid>
                )}
                <Grid
                    container
                    spacing={gridSpacing}
                    item
                    xs={props.editable ? 10 : 12}
                    justifyContent="space-evenly"
                >
                    <GridFieldsDisplay
                        fields={primaryFields}
                        editMode={editMode}
                        onEdit={OnEditData}
                        enums={props.enums}
                        columnWidth={props.columnWidth}
                    />
                </Grid>
                {props.editable && (
                    <Grid item xs={2}>
                        <FormControlLabel
                            control={<Switch color="primary" checked={editMode} size="small" />}
                            label="Edit Mode"
                            labelPlacement="bottom"
                            color="secondary"
                            className={classes.switch}
                            onChange={() => {
                                if (editMode) {
                                    setPrimaryFields(props.fields);
                                    if (props.collapsibleFields) {
                                        setSecondaryFields(props.collapsibleFields);
                                    }
                                }
                                setEditMode(!editMode);
                            }}
                        />
                    </Grid>
                )}
            </Grid>
            {props.collapsibleFields && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justifyContent="space-evenly">
                            <GridFieldsDisplay
                                fields={secondaryFields}
                                columnWidth={props.columnWidth}
                                editMode={editMode}
                                onEdit={OnEditData}
                                enums={props.enums}
                            />
                        </Grid>
                    </Collapse>
                    <Button
                        className={classes.button}
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
            {editMode && (
                <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={() => {
                        setEditMode(false);
                        if (props.update) {
                            props.update(primaryFields.concat(secondaryFields));
                        }
                    }}
                >
                    Save changes
                </Button>
            )}
        </>
    );
}
