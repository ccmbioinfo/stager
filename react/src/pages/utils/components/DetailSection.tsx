import React, { useState, useEffect } from "react";
import {
    Button,
    Collapse,
    Grid,
    Typography,
    TextField as MuiTextField,
    Fade,
    Box,
    makeStyles,
    IconButton,
    FormControlLabel,
    Switch,
    MenuItem,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import { FieldDisplayValueType, Field, PseudoBooleanReadableMap, PseudoBoolean } from "../typings";

const gridSpacing = 2;
const titleWidth = 12;
const infoWidth = 6;

const multilineFields = ["notes"];
const enumFields = [
    "sex",
    "participant_type",
    "condition",
    "extraction_protocol",
    "read_type",
    "dataset_type",
];
const nonNullableFields = ["dataset_type", "condition"]; //does not include uneditable fields
const booleanFields = ["affected", "solved"];
const dateFields = ["library_prep_date"];

const useStyles = makeStyles(theme => ({
    textField: {
        margin: theme.spacing(0.2),
        width: "50%",
    },
    box: {
        padding: theme.spacing(0.5),
    },
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

const capitalizeFirstLetter = (s: string | undefined) => {
    if (s) return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatValue = (value: FieldDisplayValueType, nullUnknown: boolean = false) => {
    let val = value;
    if (Array.isArray(value)) val = value.join(", ");
    else if (value === null || value === undefined)
        nullUnknown ? (val = PseudoBooleanReadableMap[("" + value) as PseudoBoolean]) : (val = "");
    else if (typeof value === "boolean")
        val = PseudoBooleanReadableMap[("" + value) as PseudoBoolean];
    return val;
};

interface FieldDisplayProps {
    title: string;
    value?: FieldDisplayValueType;
    className?: string;
    bool?: boolean;
}
/* Simple Typography component to display "title: value" */
function FieldDisplay({ title, value, className, bool }: FieldDisplayProps) {
    return (
        <Typography variant="body1" gutterBottom>
            <b>{title}:</b> <span className={className}>{formatValue(value, bool)}</span>
        </Typography>
    );
}

/* Given a fieldName of a Field object, return the corresponding field in enums */
const getFieldInEnums = (fieldName: string): string => {
    switch (fieldName) {
        case "sex":
            return "Sex";
        case "participant_type":
            return "ParticipantType";
        case "condition":
            return "DatasetCondition";
        case "extraction_protocol":
            return "DatasetExtractionProtocol";
        case "read_type":
            return "DatasetReadType";
        case "dataset_type":
            return "DatasetType";
        default:
            return "Sex";
    }
};

function TextField({
    field,
    enums,
    onEdit,
}: {
    field: Field;
    enums: any;
    onEdit: (fieldName: string | undefined, value: any) => void;
}) {
    const classes = useStyles();
    const nullOption = (
        <MenuItem value={""}>
            <em>None</em>
        </MenuItem>
    );
    if (!field.fieldName || !enums) return <></>;
    if (enumFields.includes(field.fieldName)) {
        return (
            <MuiTextField
                className={classes.textField}
                margin="dense"
                label={field.title}
                value={formatValue(field.value)}
                required={nonNullableFields.includes(field.fieldName)}
                disabled={field.disableEdit}
                select
                onChange={e => {
                    onEdit(field.fieldName, e.target.value === "" ? null : e.target.value);
                }}
            >
                {enums[getFieldInEnums(field.fieldName)].map((option: string) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
                {!nonNullableFields.includes(field.fieldName) && nullOption}
            </MuiTextField>
        );
    } else if (booleanFields.includes(field.fieldName)) {
        // Need to clean this up when refactoring this section
        return (
            <MuiTextField
                className={classes.textField}
                margin="dense"
                label={field.title}
                value={formatValue(field.value, true)}
                required={nonNullableFields.includes(field.fieldName)}
                disabled={field.disableEdit}
                select
                onChange={e => {
                    let val;
                    if (e.target.value === "No") val = false;
                    else if (e.target.value === "Yes") val = true;
                    else val = null;
                    onEdit(field.fieldName, val);
                }}
            >
                {["Yes", "No", "Unknown"].map((option: string) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </MuiTextField>
        );
    } else if (multilineFields.includes(field.fieldName)) {
        return (
            <MuiTextField
                className={classes.textField}
                margin="dense"
                label={field.title}
                value={formatValue(field.value)}
                required={nonNullableFields.includes(field.fieldName)}
                disabled={field.disableEdit}
                multiline
                rowsMax={2}
                onChange={e => onEdit(field.fieldName, e.target.value)}
            />
        );
    } else if (dateFields.includes(field.fieldName)) {
        return (
            <MuiTextField
                className={classes.textField}
                margin="dense"
                label={field.title}
                value={formatValue(field.value)}
                required={nonNullableFields.includes(field.fieldName)}
                disabled={field.disableEdit}
                InputLabelProps={{ shrink: true }}
                type="date"
                onChange={e => {
                    onEdit(field.fieldName, e.target.value);
                }}
            />
        );
    }
    return (
        <MuiTextField
            className={classes.textField}
            margin="dense"
            label={field.title}
            value={formatValue(field.value)}
            required={nonNullableFields.includes(field.fieldName)}
            disabled={field.disableEdit}
            onChange={e => onEdit(field.fieldName, e.target.value === "" ? null : e.target.value)}
        />
    );
}

function GridFieldsDisplay({
    fields,
    editMode,
    position,
    onEdit,
}: {
    fields: Field[];
    editMode: boolean;
    position: "left" | "right";
    onEdit: (fieldName: string | undefined, value: any) => void;
}) {
    const classes = useStyles();
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

    return (
        <Grid item xs={infoWidth}>
            {fields.map((field, index) => {
                if (position === "left" && index >= Math.ceil(fields.length / 2)) {
                    return <></>;
                } else if (position === "right" && index < Math.ceil(fields.length / 2)) {
                    return <></>;
                } else {
                    return (
                        <>
                            <Fade in={editMode}>
                                <Box hidden={!editMode}>
                                    <TextField field={field} enums={enums} onEdit={onEdit} />
                                </Box>
                            </Fade>
                            <Fade in={!editMode}>
                                <Box className={classes.box} hidden={editMode}>
                                    <FieldDisplay
                                        title={field.title}
                                        value={field.value}
                                        bool={
                                            !!field.fieldName &&
                                            !!booleanFields.includes(field.fieldName)
                                        }
                                    />
                                </Box>
                            </Fade>
                        </>
                    );
                }
            })}
        </Grid>
    );
}
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
                `${capitalizeFirstLetter(dataInfo?.type)} ${
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
                        position="left"
                    />
                    <GridFieldsDisplay
                        fields={primaryFields}
                        editMode={editMode}
                        onEdit={OnEditData}
                        position="right"
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
                                position="left"
                            />
                            <GridFieldsDisplay
                                fields={secondaryFields}
                                editMode={editMode}
                                onEdit={OnEditData}
                                position="right"
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
