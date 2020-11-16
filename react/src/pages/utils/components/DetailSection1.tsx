import React, { useState } from "react";
import {
    Button,
    Collapse,
    Grid,
    Typography,
    TextField,
    ButtonGroup,
    Fade,
    Box,
    makeStyles,
    MenuItem,
} from "@material-ui/core";
import { FieldDisplayValueType, Field } from "../typings";

const gridSpacing = 2;
const titleWidth = 12;
const infoWidth = 6;

interface FieldDisplayProps {
    title: string;
    value?: FieldDisplayValueType;
}

/* Simple Typography component to display "title: value" */
function FieldDisplay({ title, value }: FieldDisplayProps) {
    let val = value;
    if (Array.isArray(value)) val = value.join(", ");
    else if (value === null || value === undefined) val = "";
    else if (typeof value === "boolean") val = value ? "Yes" : "No";

    return (
        <Typography variant="body1" gutterBottom>
            <b>{title}:</b> {val}
        </Typography>
    );
}

const formatValue = (value: FieldDisplayValueType) => {
    let val = value;
    if (Array.isArray(value)) val = value.join(", ");
    else if (value === null || value === undefined) val = "";
    else if (typeof value === "boolean") val = value ? "Yes" : "No";
    return val;
};

const useFieldsDisplayStyles = makeStyles(theme => ({
    textField: {
        margin: theme.spacing(0.2),
        // padding: theme.spacing(0),
    },
}));
const sexes = [
    {
        value: "Female",
        label: "Female",
    },
    {
        value: "Male",
        label: "Male",
    },
    {
        value: "Other",
        label: "Other",
    },
];
  
function LeftGridFieldsDisplay({ fields, editMode }: { fields: Field[]; editMode: boolean }) {
    const classes = useFieldsDisplayStyles();
    const [currFields, setCurrFields] = useState(fields);

  
    return (
        <>
            {currFields.map((field, index) => {
                if (index >= Math.ceil(fields.length / 2)) {
                    return <></>;
                } else {
                    return (
                        <>
                            {editMode ? (
                                <Fade in={editMode}>
                                    {
                                        field.title === "Sex" ? (
                                            <TextField
                                                id="standard-select-currency"
                                                select
                                                label={field.title}
                                                value={field.value}
                                                onChange={(e)=> {
                                                    const newFields = [...currFields]
                                                    newFields[index] = {...newFields[index], value: e.target.value}
                                                    setCurrFields(newFields)
                                                }}
                                                fullWidth
                                                >
                                                {sexes.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                    </MenuItem>
                                                ))}
                                                </TextField>
                                        ) : (
                                            <TextField
                                                className={classes.textField}
                                                id="standard-basic"
                                                label={field.title}
                                                defaultValue={formatValue(field.value)}
                                                fullWidth
                                                disabled={field.disableEdit}
                                            />
                                        )
                                    }
                                    
                                </Fade>
                            ) : (
                                <Fade in={!editMode}>
                                    <Box>
                                        <FieldDisplay title={field.title} value={field.value} />
                                    </Box>
                                </Fade>
                            )}
                        </>
                    );
                }
            })}
        </>
    );
}

function RightGridFieldsDisplay({ fields, editMode }: { fields: Field[]; editMode: boolean }) {
    const classes = useFieldsDisplayStyles();
    return (
        <>
            {fields.map((field, index) => {
                if (index < Math.ceil(fields.length / 2)) {
                    return <></>;
                } else {
                    return (
                        <>
                            {editMode ? (
                                <Fade in={editMode}>
                                    <TextField
                                        className={classes.textField}
                                        id="standard-basic"
                                        label={field.title}
                                        defaultValue={formatValue(field.value)}
                                        fullWidth
                                    />
                                </Fade>
                            ) : (
                                <Fade in={!editMode}>
                                    <Box>
                                        <FieldDisplay title={field.title} value={field.value} />
                                    </Box>
                                </Fade>
                            )}
                        </>
                    );
                }
            })}
        </>
    );
}
interface DetailSectionProps {
    // titles: string[];
    // values: FieldDisplayValueType[];
    fields: Field[];
    collapsibleFields?: Field[];
    title?: string;
}

export default function DetailSection({ fields, collapsibleFields, title }: DetailSectionProps) {
    const [moreDetails, setMoreDetails] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);

    return (
        <>
            <Grid container spacing={gridSpacing} justify="space-evenly">
                {title && (
                    <Grid item xs={titleWidth}>
                        <Typography variant="h6">{title}</Typography>
                    </Grid>
                )}
                <Grid item xs={infoWidth}>
                    <LeftGridFieldsDisplay fields={fields} editMode={editMode} />
                </Grid>
                <Grid item xs={infoWidth}>
                    <RightGridFieldsDisplay fields={fields} editMode={editMode} />
                </Grid>
                {editMode ? (
                    <ButtonGroup variant="contained" color="primary">
                        <Button color="default" onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setEditMode(false)}>Submit Changes</Button>
                    </ButtonGroup>
                ) : (
                    <Button variant="contained" color="primary" onClick={() => setEditMode(true)}>
                        Edit
                    </Button>
                )}
            </Grid>
            {collapsibleFields && (
                <>
                    <Collapse in={moreDetails}>
                        <Grid container spacing={gridSpacing} justify="space-evenly">
                            <Grid item xs={infoWidth}>
                                <LeftGridFieldsDisplay
                                    fields={collapsibleFields}
                                    editMode={editMode}
                                />
                            </Grid>
                            <Grid item xs={infoWidth}>
                                <RightGridFieldsDisplay
                                    fields={collapsibleFields}
                                    editMode={editMode}
                                />
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
