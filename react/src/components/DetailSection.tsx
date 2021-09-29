import React, { useEffect, useState } from "react";
import {
    Button,
    Collapse,
    FormControlLabel,
    Grid,
    IconButton,
    makeStyles,
    Switch,
    Typography,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { useSnackbar } from "notistack";
import { useErrorSnackbar } from "../hooks";
import { Field } from "../typings";
import GridFieldsDisplay, { Width } from "./GridFieldsDisplay";

dayjs.extend(customParseFormat);

const gridSpacing = 2;
const titleWidth = 12;

const useStyles = makeStyles(theme => ({
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
    columnWidth?: Width;
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
    const enqueueErrorSnackbar = useErrorSnackbar();

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

            field.entryError = false;
            if (field.fieldName === "read_length" && value && value.match(/^[0-9]+$/) == null) {
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
                // This is a temporary fix for 500 Server Error invoked when library_prep_date
                // is sent to the backend. This is probably because library_prep_date
                // is  stored in a non-ISO string format, although it should. This fix needs to be
                // revisited after fixing the table non-refreshing issue (#842)

                // Due to the inconsistent refreshing/data update issue (#842),
                // sometimes field.value is in ISO format -> else clause,
                // sometimes field.value is in human readable format (eg: Wednesday, September 22, 2021 8:00 PM) -> if clause.
                if (
                    field.fieldName === "library_prep_date" &&
                    field.value != null &&
                    typeof field.value === "string" &&
                    /[A-Z]/.test(field.value[0])
                ) {
                    field.value = field.value.substring(field.value.indexOf(",") + 2);
                    newData[field.fieldName] = dayjs(field.value, "MMMM D, YYYY h:mm A").format(
                        "YYYY-MM-D"
                    );
                } else {
                    newData[field.fieldName] = field.value;
                }
            }
        });
        const response = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newData),
        });
        if (response.ok) {
            const data = await response.json();
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
            enqueueErrorSnackbar(
                response,
                `Failed to edit ${props.dataInfo?.type} ${props.dataInfo?.identifier}`
            );
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
                    xs={props.dataInfo ? 10 : 12}
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
        </>
    );
}
