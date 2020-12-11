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
    collapsibleFields?: Field[];
    title?: string;
    dataInfo?: DataInfo; // dataInfo indicates data is editable
    linkPath?: string;
}

export default function DetailSection({
    fields,
    collapsibleFields,
    title,
    dataInfo,
}: DetailSectionProps) {
    const classes = useStyles();
    const [moreDetails, setMoreDetails] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [primaryFields, setPrimaryFields] = useState<Field[]>([]);
    const [secondaryFields, setSecondaryFields] = useState<Field[]>(
        collapsibleFields ? collapsibleFields : []
    );
    const { enqueueSnackbar } = useSnackbar();

    // Props are the main source of truth about the state of the fields
    useEffect(() => {
        setPrimaryFields(fields);
    }, [fields]);

    useEffect(() => {
        setSecondaryFields(collapsibleFields ? collapsibleFields : []);
    }, [collapsibleFields]);

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
        let url;
        if (dataInfo?.type === "participant") {
            url = `/api/participants/${dataInfo?.ID}`;
        } else {
            url = `/api/datasets/${dataInfo?.ID}`;
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
            if (dataInfo?.onUpdate) dataInfo!.onUpdate(dataInfo.ID, data);
            enqueueSnackbar(
                `${dataInfo?.type.replace(/$(\w)/g, "$&".toUpperCase())} ${
                    dataInfo?.identifier
                } updated successfully`,
                {
                    variant: "success",
                }
            );
        } else {
            setPrimaryFields(fields);
            if (collapsibleFields) {
                setSecondaryFields(collapsibleFields);
            }
            console.error(
                `PATCH /api/${dataInfo?.type}s/${dataInfo?.ID} failed with ${response.status}: ${response.statusText}`
            );
            enqueueSnackbar(
                `Failed to edit ${dataInfo?.type} ${dataInfo?.identifier} - ${response.status} ${response.statusText}`,
                { variant: "error" }
            );
        }
    }

    return (
        <>
            <Grid container spacing={gridSpacing} justify="space-between">
                {title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{title}</Typography>
                    </Grid>
                )}
                <Grid
                    container
                    spacing={gridSpacing}
                    item
                    xs={dataInfo ? 10 : 12}
                    justify="space-evenly"
                >
                    <GridFieldsDisplay
                        fields={primaryFields}
                        editMode={editMode}
                        onEdit={OnEditData}
                    />
                </Grid>
                {dataInfo && (
                    <Grid item xs={2}>
                        <FormControlLabel
                            control={<Switch color="primary" checked={editMode} size="small" />}
                            label="Edit Mode"
                            labelPlacement="bottom"
                            color="secondary"
                            className={classes.switch}
                            onChange={() => {
                                if (editMode) {
                                    setPrimaryFields(fields);
                                    if (collapsibleFields) {
                                        setSecondaryFields(collapsibleFields);
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
            {collapsibleFields && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <GridFieldsDisplay
                                fields={secondaryFields}
                                editMode={editMode}
                                onEdit={OnEditData}
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
