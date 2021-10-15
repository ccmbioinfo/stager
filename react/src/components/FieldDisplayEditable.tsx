import React from "react";
import { Box, Fade, makeStyles, MenuItem, TextField, TextFieldProps } from "@material-ui/core";
import { formatFieldValue } from "../functions";
import { Field, PseudoBooleanReadableMap } from "../typings";
import FieldDisplay from "./FieldDisplay";

// Alias for really long type
type TextFieldEvent = React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>;

const multilineFields = ["notes"];
const enumFields = ["sex", "participant_type", "condition", "read_type", "dataset_type"];
const nonNullableFields = ["dataset_type", "condition"]; //does not include uneditable fields
const booleanFields = ["affected", "solved"];
const dateFields = ["library_prep_date"];

/**
 * Given a fieldName of a Field object, return the corresponding field in enums
 */
function getFieldInEnums(fieldName: string): string {
    switch (fieldName) {
        case "sex":
            return "Sex";
        case "participant_type":
            return "ParticipantType";
        case "condition":
            return "DatasetCondition";
        case "read_type":
            return "DatasetReadType";
        case "dataset_type":
            return "DatasetType";
        default:
            return "Sex";
    }
}

const useTextStyles = makeStyles(theme => ({
    textField: {
        margin: theme.spacing(0.2),
    },
}));

/**
 * A material-ui text field whose form changes depending on the type of field (date, long text, etc.)
 */
function EnhancedTextField({
    field,
    enums,
    onEdit,
}: {
    field: Field;
    enums?: Record<string, string[]>;
    onEdit: (fieldName: string | undefined, value: boolean | string | null) => void;
}) {
    const classes = useTextStyles();
    const nullOption = (
        <MenuItem value="" key="">
            <em>None</em>
        </MenuItem>
    );
    if (!field.fieldName || !enums) return <></>;

    let children: React.ReactNode = [];

    // Props common to all variants
    const textFieldProps: TextFieldProps = {
        error: field.entryError,
        id: "standard-error",
        helperText:
            field.entryError && field.fieldName === "month_of_birth"
                ? "MM-YYYY"
                : field.entryError
                ? "Incorrect entry"
                : " ",
        className: classes.textField,
        fullWidth: true,
        margin: "dense",
        label: field.title,
        value: formatFieldValue(field.value),
        required: nonNullableFields.includes(field.fieldName),
        disabled: field.disableEdit,
        onChange: (e: TextFieldEvent) => onEdit(field.fieldName, e.target.value), // default
        inputProps: { maxLength: field.maxLength },
    };

    // Props specific to each variant
    if (enumFields.includes(field.fieldName)) {
        // Value is chosen from a list
        textFieldProps.select = true;
        textFieldProps.onChange = (e: TextFieldEvent) => {
            onEdit(field.fieldName, e.target.value === "" ? null : e.target.value);
        };
        children = [
            ...enums[getFieldInEnums(field.fieldName)]?.map((option: string) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            )),
            !nonNullableFields.includes(field.fieldName) && nullOption,
        ];
    } else if (booleanFields.includes(field.fieldName)) {
        // Value is a boolean or null
        textFieldProps.select = true;
        textFieldProps.onChange = (e: TextFieldEvent) => {
            let val;
            switch (e.target.value) {
                case "No":
                    val = false;
                    break;
                case "Yes":
                    val = true;
                    break;
                default:
                    val = null;
                    break;
            }
            onEdit(field.fieldName, val);
        };
        textFieldProps.value = formatFieldValue(field.value, true);

        const options = Object.values(PseudoBooleanReadableMap);
        children = [
            ...options.map((option: string) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            )),
        ];
    } else if (multilineFields.includes(field.fieldName)) {
        // Value is typed in, and can be really long (notes)
        textFieldProps.multiline = true;
        textFieldProps.rowsMax = 2;
    } else if (dateFields.includes(field.fieldName)) {
        // Value is a date string
        textFieldProps.InputLabelProps = { shrink: true };
        textFieldProps.type = "date";
    } else {
        // Value is a string (default)
        textFieldProps.onChange = (e: TextFieldEvent) =>
            onEdit(field.fieldName, e.target.value === "" ? null : e.target.value);
    }

    return <TextField {...textFieldProps}>{children}</TextField>;
}

const useStyles = makeStyles(theme => ({
    box: {
        padding: theme.spacing(0.5),
    },
}));

export default function FieldDisplayEditable(props: {
    field: Field;
    editMode: boolean;
    onEdit: (fieldName: string | undefined, value: any) => void;
    enums?: Record<string, string[]>;
}) {
    const classes = useStyles();

    return (
        <>
            <Fade in={props.editMode}>
                <Box hidden={!props.editMode}>
                    <EnhancedTextField
                        field={props.field}
                        enums={props.enums}
                        onEdit={props.onEdit}
                    />
                </Box>
            </Fade>
            <Fade in={!props.editMode}>
                <Box className={classes.box} hidden={props.editMode}>
                    <FieldDisplay
                        title={props.field.title}
                        value={props.field.value}
                        bool={
                            !!props.field.fieldName &&
                            !!booleanFields.includes(props.field.fieldName)
                        }
                    />
                </Box>
            </Fade>
        </>
    );
}
