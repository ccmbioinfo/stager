import React, { useState, useEffect } from "react";
import {
    Button,
    Collapse,
    Grid,
    Typography,
    makeStyles,
    IconButton,
    FormControlLabel,
    Switch,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { Field } from "../typings";
import GridFieldsDisplay from "./GridFieldsDisplay";

const gridSpacing = 2;
const titleWidth = 12;

const useStyles = makeStyles(theme => ({
    fieldDisplay: {
        textDecoration: "underline dotted",
    },
    fab: {
        display: "block",
        width: "40%",
        left: "30%",
        right: "30%",
        padding: theme.spacing(1),
        margin: 0,
    },
    switch: {
        display: "block",
        padding: theme.spacing(1),
        margin: 0,
    },
    actionButtons: {
        position: "absolute",
        right: theme.spacing(1),
    },
    button: {
        marginRight: theme.spacing(1),
    },
}));

interface DataInfo {
    type: "participant" | "dataset";
    ID: string;
    identifier: string; // participant codename for participant, dataset ID for dataset
    onUpdate?: (participant_id: string, newParticipant: { [key: string]: any }) => void;
}

interface DetailSectionProps {
    fields: Field[];
    enums?: Record<string, string[]>;
    collapsibleFields?: Field[];
    title?: string;
    dataInfo?: DataInfo; // dataInfo indicates data is editable
    linkPath?: string;
}

export default function DetailSection(props: DetailSectionProps) {
    const classes = useStyles();
    const [moreDetails, setMoreDetails] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);

    // These keep track of state when editing
    // When edit is finalized, send to backend to update props
    const [primaryFields, setPrimaryFields] = useState<Field[]>([]);
    const [secondaryFields, setSecondaryFields] = useState<Field[]>(
        props.collapsibleFields ? props.collapsibleFields : []
    );
    const { enqueueSnackbar } = useSnackbar();

    // Props are the main source of truth about the state of the fields
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
            const newField = {
                ...field,
                value: value,
            };
            const newData = [...fieldsOnEdit];
            newData[idx] = newField;
            setFields(newData);
        }
    }

    async function updateData() {
        // TODO: Revisit after /api/partipants part of #283
        let url;
        if (props.dataInfo?.type === "participant") {
            url = `/api/participants/${props.dataInfo?.ID}`;
        } else {
            url = `/api/datasets/${props.dataInfo?.ID}`;
        }
        const newData: { [key: string]: any } = {};
        primaryFields.concat(secondaryFields).forEach(field => {
            if (field.fieldName && !field.disableEdit) {
                newData[field.fieldName] = field.value;
            }
        });
        const response = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newData),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            if (props.dataInfo?.onUpdate) props.dataInfo!.onUpdate(props.dataInfo.ID, data);
            enqueueSnackbar(
                `${props.dataInfo?.type.replace(/$(\w)/g, "$&".toUpperCase())} ${
                    props.dataInfo?.identifier
                } updated successfully`,
                {
                    variant: "success",
                }
            );
        } else {
            setPrimaryFields(props.fields);
            if (props.collapsibleFields) {
                setSecondaryFields(props.collapsibleFields);
            }
            console.error(
                `PATCH /api/${props.dataInfo?.type}s/${props.dataInfo?.ID} failed with ${response.status}: ${response.statusText}`
            );
            enqueueSnackbar(
                `Failed to edit ${props.dataInfo?.type} ${props.dataInfo?.identifier} - ${response.status} ${response.statusText}`,
                { variant: "error" }
            );
        }
    }

    return (
        <>
            <Grid container spacing={gridSpacing} justify="space-between">
                {props.title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{props.title}</Typography>
                    </Grid>
                )}
                <Grid
                    container
                    spacing={gridSpacing}
                    item
                    xs={props.dataInfo ? 10 : 12}
                    justify="space-evenly"
                >
                    <GridFieldsDisplay
                        fields={primaryFields}
                        editMode={editMode}
                        onEdit={OnEditData}
                        enums={props.enums}
                    />
                </Grid>
                {props.dataInfo && (
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
                        {editMode && (
                            <IconButton
                                className={classes.fab}
                                color="secondary"
                                onClick={() => {
                                    setEditMode(false);
                                    updateData();
                                }}
                            >
                                <Check fontSize="large" />
                            </IconButton>
                        )}
                    </Grid>
                )}
            </Grid>
            {props.collapsibleFields && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <GridFieldsDisplay
                                fields={secondaryFields}
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
        </>
    );
}
